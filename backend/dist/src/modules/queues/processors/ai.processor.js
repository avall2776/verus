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
        this.CENTRAL_COMERCIAL = '+5554999974220';
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
        const historyDb = await this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            take: 15,
        });
        const historyForAi = historyDb
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
            await this.messagingService.sendText({
                tenantId,
                phone: conversation.contact.phone,
                content: aiResponse.resposta_cliente
            });
            const savedMsg = await this.prisma.message.create({
                data: {
                    tenantId,
                    conversationId,
                    contactId,
                    providerMessageId: `out_${Date.now()}`,
                    content: aiResponse.resposta_cliente,
                    direction: 'OUTBOUND',
                    senderType: 'system',
                    status: 'delivered',
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
            const alertMsg = `🚨 *NOVO LEAD QUALIFICADO* 🚨\n\n*Cliente:* ${aiResponse.nome_cliente || conversation.contact.name}\n*Telefone:* ${conversation.contact.phone}\n*Interesse:* ${aiResponse.produto_interesse || 'Não especificado'}\n*Motivo:* ${aiResponse.motivo_transferencia}\n\n*Resumo:* ${aiResponse.resumo_atendimento}`;
            await this.messagingService.sendText({
                tenantId,
                phone: this.CENTRAL_COMERCIAL,
                content: alertMsg,
            });
            return { status: 'human_takeover_executed' };
        }
        return { status: 'success' };
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