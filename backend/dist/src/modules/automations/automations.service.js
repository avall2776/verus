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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AutomationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const messaging_service_1 = require("../messaging/messaging.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let AutomationsService = AutomationsService_1 = class AutomationsService {
    constructor(prisma, messagingService, automationsQueue) {
        this.prisma = prisma;
        this.messagingService = messagingService;
        this.automationsQueue = automationsQueue;
        this.logger = new common_1.Logger(AutomationsService_1.name);
    }
    async findAll(tenantId) {
        return this.prisma.automation.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { logs: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findOne(tenantId, id) {
        const auto = await this.prisma.automation.findUnique({
            where: { id },
            include: {
                logs: {
                    take: 20,
                    orderBy: { executedAt: 'desc' }
                }
            }
        });
        if (!auto || auto.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Automação não encontrada');
        }
        return auto;
    }
    async create(tenantId, data) {
        const triggerConditions = data.triggerConditions || data.conditions || {};
        const actionType = data.actionType || (data.actions && data.actions[0]?.type) || 'SEND_WHATSAPP';
        const actionPayload = data.actionPayload || (data.actions && data.actions[0]) || {};
        const actions = data.actions || [{ type: actionType, ...actionPayload }];
        return this.prisma.automation.create({
            data: {
                tenantId,
                name: data.name,
                description: data.description || null,
                triggerType: data.triggerType,
                triggerConditions,
                conditions: triggerConditions,
                actionType,
                actionPayload,
                actions,
                isActive: data.isActive !== undefined ? data.isActive : true
            }
        });
    }
    async update(tenantId, id, data) {
        const auto = await this.prisma.automation.findUnique({ where: { id } });
        if (!auto || auto.tenantId !== tenantId)
            throw new common_1.NotFoundException('Automação não encontrada');
        const updateData = { ...data };
        if (data.triggerConditions !== undefined || data.conditions !== undefined) {
            const cond = data.triggerConditions || data.conditions || {};
            updateData.triggerConditions = cond;
            updateData.conditions = cond;
        }
        if (data.actionType !== undefined || data.actionPayload !== undefined) {
            const aType = data.actionType || auto.actionType;
            const aPayload = data.actionPayload !== undefined ? data.actionPayload : auto.actionPayload;
            updateData.actionType = aType;
            updateData.actionPayload = aPayload;
            updateData.actions = [{ type: aType, ...(typeof aPayload === 'object' ? aPayload : {}) }];
        }
        return this.prisma.automation.update({
            where: { id },
            data: updateData
        });
    }
    async remove(tenantId, id) {
        const auto = await this.prisma.automation.findUnique({ where: { id } });
        if (!auto || auto.tenantId !== tenantId)
            throw new common_1.NotFoundException('Automação não encontrada');
        return this.prisma.automation.delete({ where: { id } });
    }
    async getLogs(tenantId) {
        return this.prisma.automationLog.findMany({
            where: { tenantId },
            include: {
                automation: {
                    select: {
                        id: true,
                        name: true,
                        triggerType: true,
                        actionType: true
                    }
                },
                contact: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true
                    }
                }
            },
            orderBy: { executedAt: 'desc' },
            take: 100
        });
    }
    async testAutomation(tenantId, id) {
        const auto = await this.prisma.automation.findUnique({ where: { id } });
        if (!auto || auto.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Automação não encontrada');
        }
        const mockContext = {
            clientName: 'Dr. Roberto Santos',
            cliente: 'Dr. Roberto Santos',
            nome: 'Dr. Roberto Santos',
            proposalCode: 'PROP-8821',
            proposta: 'PROP-8821',
            dealTitle: 'Implementação Enterprise VERSUS',
            titulo: 'Implementação Enterprise VERSUS',
            value: 'R$ 15.000,00',
            valor: 'R$ 15.000,00',
            phone: '+55 11 98765-4321',
            telefone: '+55 11 98765-4321',
            companyName: 'Santos & Associados',
            empresa: 'Santos & Associados',
            userEmail: 'comercial@versus.io',
            vendedor: 'comercial@versus.io'
        };
        const actionType = auto.actionType || auto.actions?.[0]?.type || 'SEND_WHATSAPP';
        const actionPayload = auto.actionPayload || auto.actions?.[0] || {};
        let resolvedMessage = '';
        if (actionPayload.message) {
            resolvedMessage = this.interpolateVariables(actionPayload.message, mockContext);
        }
        const payloadDetails = {
            type: 'MANUAL_TEST_EXECUTION',
            simulated: true,
            triggerType: auto.triggerType,
            actionType,
            actionPayload,
            resolvedMessage: resolvedMessage || undefined,
            mockContext,
            executedAt: new Date().toISOString()
        };
        const log = await this.prisma.automationLog.create({
            data: {
                tenantId,
                automationId: auto.id,
                status: 'SUCCESS',
                payloadDetails,
                executedAt: new Date()
            }
        });
        this.logger.log(`Teste manual da automação ${auto.id} concluído com sucesso (Log: ${log.id}).`);
        return {
            success: true,
            message: `Automação "${auto.name}" disparada e validada com sucesso!`,
            logId: log.id,
            actionType,
            resolvedMessage,
            executedAt: log.executedAt
        };
    }
    interpolateVariables(template, context) {
        if (!template)
            return '';
        return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
            const lowerKey = key.toLowerCase();
            if (context[key] !== undefined && context[key] !== null) {
                return String(context[key]);
            }
            const foundEntry = Object.entries(context).find(([k]) => k.toLowerCase() === lowerKey);
            if (foundEntry && foundEntry[1] !== undefined && foundEntry[1] !== null) {
                return String(foundEntry[1]);
            }
            return match;
        });
    }
    async evaluateEvent(tenantId, triggerType, eventData) {
        const automations = await this.prisma.automation.findMany({
            where: {
                tenantId,
                isActive: true,
                OR: [
                    { triggerType },
                    ...(triggerType === 'STAGE_CHANGED' ? [{ triggerType: 'DEAL_STAGE_CHANGED' }] : []),
                    ...(triggerType === 'DEAL_STAGE_CHANGED' ? [{ triggerType: 'STAGE_CHANGED' }] : []),
                    ...(triggerType === 'INACTIVITY' ? [{ triggerType: 'INACTIVITY_TIMEOUT' }] : []),
                    ...(triggerType === 'INACTIVITY_TIMEOUT' ? [{ triggerType: 'INACTIVITY' }] : [])
                ]
            }
        });
        if (!automations.length)
            return;
        for (const automation of automations) {
            let conditionMet = true;
            const conditions = automation.triggerConditions || automation.conditions || {};
            if (conditions.tag && eventData.tag && eventData.tag !== conditions.tag) {
                conditionMet = false;
            }
            if (conditions.stage && eventData.stage && eventData.stage !== conditions.stage) {
                conditionMet = false;
            }
            if (conditions.minValue && eventData.value && Number(eventData.value) < Number(conditions.minValue)) {
                conditionMet = false;
            }
            if (!conditionMet)
                continue;
            if (triggerType === 'INACTIVITY' || triggerType === 'INACTIVITY_TIMEOUT') {
                const timeoutMinutes = conditions.timeoutMinutes || 60;
                await this.automationsQueue.add('processInactivity', {
                    tenantId,
                    automationId: automation.id,
                    contactId: eventData.contactId,
                    eventData: { ...eventData, triggeredAt: new Date().toISOString() }
                }, {
                    delay: timeoutMinutes * 60 * 1000,
                    jobId: `inactivity_${automation.id}_${eventData.contactId}`
                });
                this.logger.log(`Agendado INACTIVITY ${automation.id} para contato ${eventData.contactId} em ${timeoutMinutes}min`);
            }
            else {
                await this.executeAction(automation, eventData);
            }
        }
    }
    async executeAction(automation, eventData) {
        const cid = eventData.contactId;
        let contact = null;
        if (cid) {
            contact = await this.prisma.contact.findUnique({ where: { id: cid } });
        }
        let success = true;
        let errorMsg = '';
        const executionDetails = {
            eventData,
            actionsExecuted: []
        };
        try {
            const actionType = automation.actionType || automation.actions?.[0]?.type;
            const actionPayload = automation.actionPayload || automation.actions?.[0] || {};
            const actionsList = (automation.actions && automation.actions.length > 0)
                ? automation.actions
                : [{ type: actionType, ...actionPayload }];
            const context = {
                clientName: contact?.name || eventData.clientName || 'Cliente',
                cliente: contact?.name || eventData.clientName || 'Cliente',
                nome: contact?.name || eventData.clientName || 'Cliente',
                phone: contact?.phone || eventData.phone || '',
                telefone: contact?.phone || eventData.phone || '',
                proposalCode: eventData.proposalCode || eventData.code || '',
                proposta: eventData.proposalCode || eventData.code || '',
                dealTitle: eventData.dealTitle || eventData.title || '',
                titulo: eventData.dealTitle || eventData.title || '',
                value: eventData.value ? `R$ ${Number(eventData.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
                valor: eventData.value ? `R$ ${Number(eventData.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
                userEmail: eventData.userEmail || '',
                vendedor: eventData.userName || eventData.userEmail || '',
                companyName: eventData.companyName || ''
            };
            for (const act of actionsList) {
                if (act.type === 'SEND_MESSAGE' || act.type === 'SEND_WHATSAPP') {
                    const rawMessage = act.message || act.content || '';
                    const finalMsg = this.interpolateVariables(rawMessage, context);
                    if (contact?.phone) {
                        await this.messagingService.sendText({
                            tenantId: automation.tenantId,
                            phone: contact.phone,
                            content: finalMsg
                        });
                        await this.prisma.message.create({
                            data: {
                                tenantId: automation.tenantId,
                                conversationId: eventData.conversationId || (await this.getOrCreateConversation(automation.tenantId, cid)).id,
                                contactId: cid,
                                content: finalMsg,
                                direction: 'OUTBOUND',
                                senderType: 'system',
                                status: 'sent'
                            }
                        });
                    }
                    executionDetails.actionsExecuted.push({
                        type: act.type,
                        recipient: contact?.phone || 'N/A',
                        resolvedMessage: finalMsg
                    });
                }
                if (act.type === 'ADD_TAG') {
                    const tag = act.tag;
                    if (tag && cid && contact) {
                        const currentTags = contact.tags || [];
                        if (!currentTags.includes(tag)) {
                            await this.prisma.contact.update({
                                where: { id: cid },
                                data: { tags: [...currentTags, tag] }
                            });
                        }
                    }
                    executionDetails.actionsExecuted.push({ type: 'ADD_TAG', tag });
                }
                if (act.type === 'TRANSFER') {
                    const departmentId = act.departmentId;
                    if (cid) {
                        const conv = await this.getOrCreateConversation(automation.tenantId, cid);
                        if (departmentId && conv) {
                            await this.prisma.conversation.update({
                                where: { id: conv.id },
                                data: { departmentId, status: 'waiting', assignedTo: null }
                            });
                        }
                    }
                    executionDetails.actionsExecuted.push({ type: 'TRANSFER', departmentId });
                }
                if (act.type === 'MOVE_STAGE' || act.type === 'UPDATE_DEAL_STAGE') {
                    const stage = act.stage || act.targetStage;
                    if (stage) {
                        let dealId = eventData.dealId;
                        if (!dealId && cid) {
                            const deal = await this.prisma.deal.findFirst({
                                where: { contactId: cid, tenantId: automation.tenantId },
                                orderBy: { createdAt: 'desc' }
                            });
                            if (deal)
                                dealId = deal.id;
                        }
                        if (dealId) {
                            await this.prisma.deal.update({ where: { id: dealId }, data: { status: stage } });
                        }
                    }
                    executionDetails.actionsExecuted.push({ type: act.type, stage });
                }
            }
        }
        catch (e) {
            success = false;
            errorMsg = e.message;
            this.logger.error(`Erro ao executar ações da automação ${automation.id}: ${e.message}`);
        }
        await this.prisma.automationLog.create({
            data: {
                tenantId: automation.tenantId,
                automationId: automation.id,
                contactId: cid || null,
                dealId: eventData.dealId || null,
                status: success ? 'SUCCESS' : 'FAILED',
                payloadDetails: executionDetails,
                errorReason: errorMsg || null,
                error: errorMsg || null,
                executedAt: new Date()
            }
        });
    }
    async getOrCreateConversation(tenantId, contactId) {
        let conv = await this.prisma.conversation.findUnique({
            where: { tenantId_contactId: { tenantId, contactId } }
        });
        if (!conv) {
            conv = await this.prisma.conversation.create({
                data: { tenantId, contactId, status: 'bot_active' }
            });
        }
        return conv;
    }
};
exports.AutomationsService = AutomationsService;
exports.AutomationsService = AutomationsService = AutomationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('automations')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        messaging_service_1.MessagingService,
        bullmq_2.Queue])
], AutomationsService);
//# sourceMappingURL=automations.service.js.map