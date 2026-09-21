"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const ai_service_1 = require("../../ai/ai.service");
const messaging_service_1 = require("../../messaging/messaging.service");
const chat_gateway_1 = require("../../chat/chat.gateway");
let AiProcessor = AiProcessor_1 = class AiProcessor extends bullmq_1.WorkerHost {
    constructor(prisma, aiService, messagingService, chatGateway) {
        super();
        this.prisma = prisma;
        this.aiService = aiService;
        this.messagingService = messagingService;
        this.chatGateway = chatGateway;
        this.logger = new common_1.Logger(AiProcessor_1.name);
    }
    async process(job) {
        const { tenantId, conversationId, contactId } = job.data;
        this.logger.debug(`Iniciando orquestração de IA para a conversa [${conversationId}]`);
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: { include: { tenant: true } } }
        });
        if (!conversation) {
            throw new Error(`Conversa ${conversationId} não encontrada.`);
        }
        if (conversation.status !== 'bot_active') {
            this.logger.warn(`Conversa [${conversationId}] está com status '${conversation.status}'. IA Abortada.`);
            return { status: 'aborted', reason: 'Not bot_active' };
        }
        const connectedInst = await this.prisma.whatsAppInstance.findFirst({
            where: { tenantId, status: 'connected' }
        });
        if (!connectedInst) {
            this.logger.warn(`Tenant [${tenantId}] sem conexão WhatsApp ativa. Pausando IA para a conversa [${conversationId}].`);
            await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { status: 'waiting' }
            });
            return { status: 'aborted', reason: 'WhatsApp disconnected' };
        }
        const historyDb = await this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            take: 15,
        });
        if (historyDb.length === 0) {
            return { status: 'aborted', reason: 'Empty history' };
        }
        const latestMessage = historyDb[0];
        if (latestMessage.senderType !== 'contact') {
            this.logger.warn(`Última mensagem da conversa [${conversationId}] não é do contato. Evitando auto-resposta / loop.`);
            return { status: 'aborted', reason: 'Last message not from contact' };
        }
        const autoReplySignatures = [
            'mensagem automática',
            'resposta automática',
            'atendimento automático',
            'horário de atendimento',
            'estamos ausentes',
            'retornaremos em breve',
            'fora do expediente',
            'auto-reply',
            'automatic reply',
            'agradecemos seu contato',
            'nosso horário é de',
            'este número não recebe chamadas',
        ];
        const incomingText = (latestMessage.content || '').toLowerCase();
        const isBotAutoReply = autoReplySignatures.some(sig => incomingText.includes(sig));
        if (isBotAutoReply) {
            this.logger.warn(`Mensagem recebida na conversa [${conversationId}] identificada como auto-resposta de outro bot. Pausando IA para evitar loop.`);
            await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { status: 'waiting' }
            });
            return { status: 'aborted', reason: 'Detected bot auto-reply loop' };
        }
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const recentCount = await this.prisma.message.count({
            where: {
                conversationId,
                createdAt: { gte: twoMinutesAgo }
            }
        });
        if (recentCount >= 6) {
            this.logger.warn(`Frequência anormal de mensagens na conversa [${conversationId}] (${recentCount} msgs em 2min). Pausando IA para segurança.`);
            await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { status: 'waiting' }
            });
            return { status: 'aborted', reason: 'Loop frequency limit exceeded' };
        }
        const historyForAi = [...historyDb]
            .reverse()
            .map(msg => ({
            role: msg.senderType === 'contact' ? 'user' : 'assistant',
            content: msg.content
        }));
        const pastDeals = await this.prisma.deal.findMany({
            where: { contactId: conversation.contact.id },
            orderBy: { updatedAt: 'desc' },
            take: 2,
        });
        let dynamicContext = `\n\n=== CONTEXTO DO CLIENTE ===\nNome do Cliente: ${conversation.contact.name}\n`;
        if (pastDeals.length > 0) {
            dynamicContext += `O cliente já teve os seguintes atendimentos anteriores (use para ter contexto, não repita se não for necessário):\n`;
            pastDeals.forEach(d => {
                dynamicContext += `- Interesse Anterior: ${d.title} | Notas: ${d.notes || 'Sem detalhes'}\n`;
            });
        }
        this.logger.log(`Enviando ${historyForAi.length} mensagens de histórico para a OpenAI (Tenant: ${conversation.contact.tenant.name})...`);
        const aiResponse = await this.aiService.processConversation(historyForAi, conversation.contact.tenant, dynamicContext);
        if (aiResponse.resposta_cliente) {
            const sendRes = await this.messagingService.sendText({
                tenantId,
                phone: conversation.contact.phone,
                content: aiResponse.resposta_cliente
            });
            const messageStatus = sendRes?.success ? 'delivered' : 'failed';
            const providerMsgId = sendRes?.messageId || `out_${Date.now()}`;
            if (!sendRes?.success) {
                this.logger.error(`Falha ao despachar resposta da IA para ${conversation.contact.phone}: ${sendRes?.error}`);
            }
            const savedMsg = await this.prisma.message.create({
                data: {
                    tenantId,
                    conversationId,
                    contactId,
                    providerMessageId: providerMsgId,
                    content: aiResponse.resposta_cliente,
                    direction: 'OUTBOUND',
                    senderType: 'system',
                    status: messageStatus,
                }
            });
            this.chatGateway.emitNewMessage(tenantId, {
                ...savedMsg,
                contact: { phone: conversation.contact.phone, name: conversation.contact.name }
            });
        }
        if (aiResponse.transferir_vendedor) {
            this.logger.log(`Lead solicitou atendimento humano. Executando protocolo de Transbordo...`);
            let assignedTo = null;
            const onlineAgents = await this.prisma.user.findMany({
                where: { tenantId, isOnline: true }
            });
            if (onlineAgents.length > 0) {
                let minLoad = Infinity;
                for (const agent of onlineAgents) {
                    const activeCount = await this.prisma.conversation.count({
                        where: { assignedTo: agent.id, status: { in: ['open', 'human_takeover'] } }
                    });
                    if (activeCount < minLoad) {
                        minLoad = activeCount;
                        assignedTo = agent.id;
                    }
                }
            }
            await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { status: 'human_takeover', assignedTo }
            });
            const dealData = {
                tenantId,
                contactId,
                title: aiResponse.produto_interesse || 'Atendimento Comercial',
                value: 0,
                status: 'new',
                notes: aiResponse.resumo_atendimento,
            };
            const updatedDeal = await this.prisma.deal.upsert({
                where: { id: `deal_${conversationId}` },
                create: dealData,
                update: dealData
            }).catch(async () => {
                return await this.prisma.deal.create({ data: dealData });
            });
            this.chatGateway.emitHandoff(tenantId, updatedDeal);
            let rawCandidatePhone = aiResponse.telefone_cliente || conversation.contact.phone;
            if (rawCandidatePhone && rawCandidatePhone.includes('@lid')) {
                const siblingContact = await this.prisma.contact.findFirst({
                    where: {
                        tenantId,
                        id: { not: contactId },
                        phone: { not: { contains: '@lid' } },
                        OR: [
                            ...(conversation.contact.name && conversation.contact.name !== 'Cliente WhatsApp'
                                ? [{ name: { equals: conversation.contact.name, mode: 'insensitive' } }]
                                : []),
                            ...(conversation.contact.whatsappLid
                                ? [{ whatsappLid: conversation.contact.whatsappLid }]
                                : [])
                        ]
                    },
                    select: { phone: true }
                });
                if (siblingContact?.phone && !siblingContact.phone.includes('@lid')) {
                    rawCandidatePhone = siblingContact.phone;
                }
            }
            const phoneInfo = this.formatCleanPhone(rawCandidatePhone);
            let alertMsg = `🚨 *NOVO LEAD QUALIFICADO* 🚨\n\n` +
                `👤 *Cliente:* ${aiResponse.nome_cliente || conversation.contact.name}\n` +
                `📱 *Telefone:* ${phoneInfo.formatted}\n`;
            if (phoneInfo.isRealPhone && phoneInfo.cleanDigits) {
                alertMsg += `🔗 *WhatsApp Direto:* https://wa.me/${phoneInfo.cleanDigits}\n`;
            }
            alertMsg += `🎯 *Interesse:* ${aiResponse.produto_interesse || 'Não especificado'}\n` +
                `📌 *Motivo:* ${aiResponse.motivo_transferencia}\n\n` +
                `📝 *Resumo do Atendimento:*\n${aiResponse.resumo_atendimento}`;
            if (!phoneInfo.isRealPhone) {
                alertMsg += `\n\n💡 *Ação:* Responda diretamente pela central de atendimento (Inbox) no VERSUS.`;
            }
            const tenant = conversation.contact.tenant;
            const targetRecipient = tenant?.leadNotificationPhone ||
                tenant?.whatsappSettings?.leadNotificationPhone ||
                tenant?.phone;
            if (targetRecipient && String(targetRecipient).trim().length >= 8) {
                this.logger.log(`[Multi-Tenant Alert] Disparando alerta de lead para o responsável [${targetRecipient}] da empresa [${tenant?.name || tenantId}]`);
                await this.messagingService.sendText({
                    tenantId,
                    phone: targetRecipient.trim(),
                    content: alertMsg,
                }).catch((err) => {
                    this.logger.error(`[Multi-Tenant Alert] Falha ao disparar alerta de lead para ${targetRecipient}: ${err.message}`);
                });
            }
            else {
                this.logger.warn(`[Multi-Tenant Alert] Empresa [${tenant?.name || tenantId}] não possui WhatsApp de Notificação de Leads configurado. O alerta foi registrado no Kanban e Inbox.`);
            }
            return { status: 'human_takeover_executed' };
        }
        return { status: 'success' };
    }
    formatCleanPhone(rawPhone) {
        if (!rawPhone)
            return { formatted: 'Não informado', isRealPhone: false, cleanDigits: '' };
        const cleanJid = rawPhone.replace('@s.whatsapp.net', '').replace('@c.us', '').trim();
        if (cleanJid.includes('@lid')) {
            return { formatted: 'WhatsApp Privado (Iniciado via Comunidade/Canal)', isRealPhone: false, cleanDigits: '' };
        }
        const digits = cleanJid.replace(/\D/g, '');
        if (!digits || digits.length < 8) {
            return { formatted: rawPhone, isRealPhone: false, cleanDigits: digits };
        }
        if (digits.length === 13 && digits.startsWith('55')) {
            const ddd = digits.slice(2, 4);
            const p1 = digits.slice(4, 9);
            const p2 = digits.slice(9);
            return { formatted: `+55 (${ddd}) ${p1}-${p2}`, isRealPhone: true, cleanDigits: digits };
        }
        if (digits.length === 12 && digits.startsWith('55')) {
            const ddd = digits.slice(2, 4);
            const p1 = digits.slice(4, 8);
            const p2 = digits.slice(8);
            return { formatted: `+55 (${ddd}) ${p1}-${p2}`, isRealPhone: true, cleanDigits: digits };
        }
        if (digits.length === 11) {
            const ddd = digits.slice(0, 2);
            const p1 = digits.slice(2, 7);
            const p2 = digits.slice(7);
            return { formatted: `+55 (${ddd}) ${p1}-${p2}`, isRealPhone: true, cleanDigits: `55${digits}` };
        }
        if (digits.length === 10) {
            const ddd = digits.slice(0, 2);
            const p1 = digits.slice(2, 6);
            const p2 = digits.slice(6);
            return { formatted: `+55 (${ddd}) ${p1}-${p2}`, isRealPhone: true, cleanDigits: `55${digits}` };
        }
        return { formatted: `+${digits}`, isRealPhone: true, cleanDigits: digits };
    }
};
exports.AiProcessor = AiProcessor;
exports.AiProcessor = AiProcessor = AiProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('ai-processing'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService,
        messaging_service_1.MessagingService,
        chat_gateway_1.ChatGateway])
], AiProcessor);
//# sourceMappingURL=ai.processor.js.map