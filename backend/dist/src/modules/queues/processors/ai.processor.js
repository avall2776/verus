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
        const { tenantId, conversationId, contactId, formName, source } = job.data;
        this.logger.debug(`Iniciando orquestração de IA para a conversa [${conversationId}]`);
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: { include: { tenant: true } } }
        });
        if (!conversation) {
            throw new Error(`Conversa ${conversationId} não encontrada.`);
        }
        const isHumanHandled = conversation.status === 'human_takeover' ||
            conversation.status === 'open' ||
            conversation.status === 'in_progress' ||
            Boolean(conversation.assignedTo);
        if (isHumanHandled) {
            this.logger.warn(`[AiProcessor] Conversa [${conversationId}] sob controle humano (status: ${conversation.status}, assignedTo: ${conversation.assignedTo}). Abortando IA.`);
            return { status: 'aborted', reason: 'human_takeover_active' };
        }
        if (conversation.status !== 'bot_active') {
            await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { status: 'bot_active' }
            });
        }
        if (conversation.contact.tenant?.aiEnabled === false) {
            this.logger.warn(`Tenant [${conversation.contact.tenant?.name || tenantId}] com auto-atendimento por IA DESLIGADO nas Configurações. Abortando IA.`);
            await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { status: 'waiting' }
            });
            return { status: 'aborted', reason: 'ai_disabled_for_tenant' };
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
        const tenant = conversation.contact.tenant;
        const keyResolution = this.aiService.resolveTenantApiKey(tenant);
        if (!keyResolution.canUseAi) {
            this.logger.warn(`Tenant [${tenant?.name || tenantId}] com degustação de IA expirada (${keyResolution.statusText}). Transferindo conversa [${conversationId}] para fila de espera humana.`);
            await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { status: 'waiting' },
            });
            return { status: 'aborted', reason: 'ai_trial_expired_no_byok' };
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
        const isHostileOrFrustrated = aiResponse.sentimento_cliente === 'FRUSTRADO_IRRITADO' ||
            aiResponse.sentimento_cliente === 'HOSTIL_RECLAMACAO';
        const complainedOfBot = Boolean(aiResponse.reclamou_de_bot);
        if (isHostileOrFrustrated || complainedOfBot) {
            this.logger.warn(`[Emotional Intelligence] Atrito detectado no WhatsApp: sentimento=${aiResponse.sentimento_cliente}, reclamou_de_bot=${complainedOfBot}. Ativando salvaguardas.`);
            aiResponse.transferir_vendedor = true;
            if (!aiResponse.motivo_transferencia || aiResponse.motivo_transferencia === 'Dúvida complexa') {
                aiResponse.motivo_transferencia = complainedOfBot
                    ? 'Cliente insatisfeito com atendimento automatizado/robô'
                    : `Cliente demonstrou frustração/irritação (${aiResponse.sentimento_cliente})`;
            }
            try {
                const lastUserMsg = historyForAi.filter(m => m.role === 'user').pop()?.content || '';
                let tipoIncidente = 'FRUSTRACAO_RESPOSTA';
                let sugestaoDiretriz = 'Adotar postura mais empática e concisa ao esclarecer dúvidas, evitando explicações prolixas e priorizando a resposta direta e objetiva.';
                if (complainedOfBot) {
                    tipoIncidente = 'RECLAMACAO_ROBO';
                    sugestaoDiretriz = 'Quando o cliente perguntar se você é um robô ou demonstrar desconfiança, seja transparente com carisma, valide a percepção dele com simpatia e ofereça transferência humana imediata sem insistência.';
                }
                else if (aiResponse.sentimento_cliente === 'HOSTIL_RECLAMACAO') {
                    tipoIncidente = 'HOSTILIDADE_CLIENTE';
                    sugestaoDiretriz = 'Diante de qualquer reclamação ou rispidez do cliente, pedir desculpas pela má experiência com humildade e acolhimento sincero, sem justificar falhas, repassando o caso de imediato a um gerente comercial.';
                }
                await this.prisma.aiLearningIncident.create({
                    data: {
                        tenantId,
                        conversationId,
                        contactId,
                        sentimento: aiResponse.sentimento_cliente || 'FRUSTRADO_IRRITADO',
                        tipoIncidente,
                        reclamouDeBot: complainedOfBot,
                        trechoCliente: lastUserMsg.slice(0, 1000),
                        respostaIa: (aiResponse.resposta_cliente || '').slice(0, 1000),
                        diagnosticoCausa: aiResponse.analise_emocional || 'O cliente demonstrou desconforto ou atrito durante o atendimento da IA.',
                        sugestaoDiretriz,
                        status: 'PENDENTE'
                    }
                });
                this.logger.log(`[AiLearningIncident] Incidente de aprendizado registrado com sucesso para análise do gestor.`);
            }
            catch (incErr) {
                this.logger.error(`[AiLearningIncident] Erro não-bloqueante ao registrar incidente: ${incErr.message}`);
            }
        }
        if (aiResponse.resposta_cliente) {
            const cleanContent = aiResponse.resposta_cliente.replace(/\*/g, '').trim();
            const sendRes = await this.messagingService.sendText({
                tenantId,
                phone: conversation.contact.phone,
                content: cleanContent
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
                    content: cleanContent,
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
        let resolvedDeptId = conversation.departmentId || null;
        try {
            const contactUpdateData = {};
            if (aiResponse.email_cliente && !conversation.contact.email) {
                contactUpdateData.email = aiResponse.email_cliente;
            }
            let extractedState = conversation.contact.state || null;
            if (aiResponse.cidade_uf && aiResponse.cidade_uf !== 'Não informado') {
                const ufMatch = String(aiResponse.cidade_uf).toUpperCase().match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/);
                if (ufMatch) {
                    extractedState = ufMatch[1];
                    contactUpdateData.state = extractedState;
                }
                const cityPart = String(aiResponse.cidade_uf).split(/[-/,]/)[0]?.trim();
                if (cityPart && cityPart.length >= 2) {
                    contactUpdateData.city = cityPart;
                }
            }
            if (Object.keys(contactUpdateData).length > 0) {
                await this.prisma.contact.update({
                    where: { id: contactId },
                    data: contactUpdateData,
                }).catch(() => { });
            }
            const candidatePhone = aiResponse.telefone_cliente || conversation.contact.phone;
            const autoDeptId = await this.resolveDepartmentSmart(tenantId, candidatePhone, extractedState);
            if (autoDeptId) {
                resolvedDeptId = autoDeptId;
                if (conversation.departmentId !== autoDeptId) {
                    const convWithDept = await this.prisma.conversation.update({
                        where: { id: conversationId },
                        data: { departmentId: autoDeptId },
                        include: {
                            contact: true,
                            department: { select: { id: true, name: true, color: true } },
                        },
                    }).catch(() => null);
                    if (convWithDept) {
                        this.chatGateway.emitConversationUpdated(tenantId, convWithDept);
                    }
                }
            }
            const existingDeal = await this.prisma.deal.findFirst({
                where: { tenantId, contactId },
                orderBy: { updatedAt: 'desc' },
                include: { contact: true, assignee: true },
            });
            const currentMeta = existingDeal?.metadata || {};
            const updatedMeta = {
                ...currentMeta,
                ...(aiResponse.produto_interesse &&
                    aiResponse.produto_interesse !== 'Não informado' &&
                    aiResponse.produto_interesse !== 'Atendimento Comercial' &&
                    aiResponse.produto_interesse !== 'Atendimento Geral'
                    ? { model: aiResponse.produto_interesse, product: aiResponse.produto_interesse }
                    : {}),
                ...(aiResponse.cidade_uf ? { city: aiResponse.cidade_uf } : {}),
                ...(aiResponse.email_cliente ? { email: aiResponse.email_cliente } : {}),
                ...(aiResponse.empresa_cliente ? { company: aiResponse.empresa_cliente } : {}),
                ...(aiResponse.cargo_cliente ? { role: aiResponse.cargo_cliente } : {}),
                ...(aiResponse.formulario_origem || formName ? { formName: aiResponse.formulario_origem || formName } : {}),
                source: source || conversation.contact.source || currentMeta.source || 'WhatsApp',
            };
            if (existingDeal && !aiResponse.transferir_vendedor) {
                const updatedDeal = await this.prisma.deal.update({
                    where: { id: existingDeal.id },
                    data: {
                        ...(aiResponse.produto_interesse &&
                            aiResponse.produto_interesse !== 'Não informado' &&
                            aiResponse.produto_interesse !== 'Atendimento Comercial' &&
                            (!existingDeal.title ||
                                existingDeal.title === 'Atendimento Comercial' ||
                                existingDeal.title === 'Novo Lead' ||
                                existingDeal.title === existingDeal.contact?.name)
                            ? { title: aiResponse.produto_interesse }
                            : {}),
                        ...(aiResponse.resumo_atendimento ? { notes: aiResponse.resumo_atendimento } : {}),
                        metadata: updatedMeta,
                    },
                    include: { contact: true, assignee: true },
                }).catch(() => null);
                if (updatedDeal) {
                    this.chatGateway.emitHandoff(tenantId, updatedDeal);
                }
            }
        }
        catch (enrichErr) {
            this.logger.warn(`Falha não-bloqueante no auto-enriquecimento do Lead pela IA: ${enrichErr.message}`);
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
            const updatedConv = await this.prisma.conversation.update({
                where: { id: conversationId },
                data: {
                    status: 'open',
                    assignedTo,
                    ...(resolvedDeptId ? { departmentId: resolvedDeptId } : {}),
                },
                include: {
                    contact: true,
                    department: { select: { id: true, name: true, color: true } },
                }
            });
            this.chatGateway.emitConversationUpdated(tenantId, updatedConv);
            this.chatGateway.server.to(tenantId).emit('aiHandoffAlert', {
                conversationId,
                contactId,
                contactName: conversation.contact.name || aiResponse.nome_cliente || 'Lead WhatsApp',
                phone: conversation.contact.phone,
                product: aiResponse.produto_interesse,
                reason: aiResponse.motivo_transferencia,
                summary: aiResponse.resumo_atendimento,
            });
            const existingDealForHandoff = await this.prisma.deal.findFirst({
                where: { tenantId, contactId },
                orderBy: { updatedAt: 'desc' },
            });
            const currentMetaHandoff = existingDealForHandoff?.metadata || {};
            const fullMeta = {
                ...currentMetaHandoff,
                ...(aiResponse.produto_interesse &&
                    aiResponse.produto_interesse !== 'Não informado' &&
                    aiResponse.produto_interesse !== 'Atendimento Geral'
                    ? { model: aiResponse.produto_interesse, product: aiResponse.produto_interesse }
                    : {}),
                ...(aiResponse.cidade_uf ? { city: aiResponse.cidade_uf } : {}),
                ...(aiResponse.email_cliente ? { email: aiResponse.email_cliente } : {}),
                ...(aiResponse.empresa_cliente ? { company: aiResponse.empresa_cliente } : {}),
                ...(aiResponse.cargo_cliente ? { role: aiResponse.cargo_cliente } : {}),
                ...(aiResponse.formulario_origem || formName ? { formName: aiResponse.formulario_origem || formName } : {}),
                source: source || conversation.contact.source || currentMetaHandoff.source || 'WhatsApp',
            };
            let updatedDeal;
            if (existingDealForHandoff) {
                updatedDeal = await this.prisma.deal.update({
                    where: { id: existingDealForHandoff.id },
                    data: {
                        title: aiResponse.produto_interesse &&
                            aiResponse.produto_interesse !== 'Não informado' &&
                            aiResponse.produto_interesse !== 'Atendimento Comercial' &&
                            aiResponse.produto_interesse !== 'Atendimento Geral'
                            ? aiResponse.produto_interesse
                            : existingDealForHandoff.title,
                        notes: aiResponse.resumo_atendimento || existingDealForHandoff.notes,
                        metadata: fullMeta,
                    },
                    include: { contact: true, assignee: true },
                });
            }
            else {
                updatedDeal = await this.prisma.deal.create({
                    data: {
                        tenantId,
                        contactId,
                        title: aiResponse.produto_interesse &&
                            aiResponse.produto_interesse !== 'Não informado' &&
                            aiResponse.produto_interesse !== 'Atendimento Geral'
                            ? aiResponse.produto_interesse
                            : 'Atendimento Comercial',
                        value: 0,
                        status: 'new',
                        notes: aiResponse.resumo_atendimento,
                        metadata: fullMeta,
                    },
                    include: { contact: true, assignee: true },
                });
            }
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
                alertMsg += `\n\n💡 *Ação:* Responda diretamente pela central de atendimento (Inbox) no Vallor.`;
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
    async resolveDepartmentSmart(tenantId, phone, state) {
        if (!phone && !state)
            return null;
        try {
            const departments = await this.prisma.department.findMany({
                where: { tenantId },
                select: { id: true, name: true },
            });
            if (!departments || departments.length === 0)
                return null;
            const dddToUf = {
                '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
                '47': 'SC', '48': 'SC', '49': 'SC',
                '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
                '67': 'MS', '65': 'MT', '66': 'MT',
                '91': 'PA', '93': 'PA', '94': 'PA', '69': 'RO', '95': 'RR', '68': 'AC', '92': 'AM', '97': 'AM', '96': 'AP',
                '62': 'GO', '64': 'GO', '61': 'DF',
                '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '37': 'MG', '38': 'MG',
                '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
                '21': 'RJ', '22': 'RJ', '24': 'RJ', '27': 'ES', '28': 'ES',
                '63': 'TO', '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
                '98': 'MA', '99': 'MA', '86': 'PI', '89': 'PI',
                '85': 'CE', '88': 'CE', '84': 'RN', '83': 'PB', '79': 'SE', '81': 'PE', '87': 'PE', '82': 'AL'
            };
            const ufToRegion = {
                'RS': 1, 'SC': 1, 'PR': 1,
                'MS': 2, 'MT': 2, 'PA': 2, 'RO': 2, 'RR': 2, 'AC': 2, 'AM': 2, 'AP': 2,
                'GO': 3, 'MG': 3, 'SP': 3, 'DF': 3, 'RJ': 3, 'ES': 3,
                'TO': 4, 'BA': 4,
                'MA': 5, 'PI': 5,
                'CE': 6, 'RN': 6, 'PB': 6, 'SE': 6, 'PE': 6, 'AL': 6
            };
            let uf = state ? state.trim().toUpperCase() : '';
            if (!uf && phone && !phone.includes('@lid')) {
                const clean = phone.replace(/\D/g, '');
                let ddd = '';
                if (clean.startsWith('55') && clean.length >= 12)
                    ddd = clean.substring(2, 4);
                else if (clean.length === 10 || clean.length === 11)
                    ddd = clean.substring(0, 2);
                if (ddd && dddToUf[ddd])
                    uf = dddToUf[ddd];
                else if (clean.startsWith('595'))
                    uf = 'RS';
            }
            if (!uf)
                return null;
            const byToken = departments.find(d => new RegExp(`(^|[^A-ZÀ-Ú])${uf}([^A-ZÀ-Ú]|$)`).test(d.name.toUpperCase()));
            if (byToken)
                return byToken.id;
            const targetRegionNum = ufToRegion[uf];
            if (targetRegionNum) {
                const matched = departments.find(d => {
                    const upper = d.name.toUpperCase();
                    return upper.includes(`REGIÃO ${targetRegionNum}`) || upper.includes(`REGIAO ${targetRegionNum}`);
                });
                if (matched)
                    return matched.id;
            }
        }
        catch (e) {
            this.logger.warn(`Erro ao resolver departamento pela IA: ${e.message}`);
        }
        return null;
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