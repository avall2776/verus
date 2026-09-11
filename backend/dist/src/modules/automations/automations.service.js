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
            orderBy: { createdAt: 'desc' }
        });
    }
    async create(tenantId, data) {
        return this.prisma.automation.create({
            data: {
                tenantId,
                name: data.name,
                triggerType: data.triggerType,
                conditions: data.conditions,
                actionType: data.actionType,
                actionData: data.actionData,
                isActive: data.isActive !== undefined ? data.isActive : true
            }
        });
    }
    async update(tenantId, id, data) {
        const auto = await this.prisma.automation.findUnique({ where: { id } });
        if (!auto || auto.tenantId !== tenantId)
            throw new common_1.NotFoundException('Automação não encontrada');
        return this.prisma.automation.update({
            where: { id },
            data
        });
    }
    async remove(tenantId, id) {
        const auto = await this.prisma.automation.findUnique({ where: { id } });
        if (!auto || auto.tenantId !== tenantId)
            throw new common_1.NotFoundException('Automação não encontrada');
        return this.prisma.automation.delete({ where: { id } });
    }
    async evaluateEvent(tenantId, triggerType, eventData) {
        const automations = await this.prisma.automation.findMany({
            where: { tenantId, triggerType, isActive: true }
        });
        if (!automations.length)
            return;
        for (const automation of automations) {
            let conditionMet = true;
            const conditions = automation.conditions || {};
            if (triggerType === 'TAG_ADDED' && conditions.tag) {
                if (eventData.tag !== conditions.tag)
                    conditionMet = false;
            }
            if (triggerType === 'STAGE_CHANGED' && conditions.stage) {
                if (eventData.stage !== conditions.stage)
                    conditionMet = false;
            }
            if (!conditionMet)
                continue;
            if (eventData.contactId) {
                const log = await this.prisma.automationLog.findFirst({
                    where: {
                        automationId: automation.id,
                        contactId: eventData.contactId
                    }
                });
                if (log) {
                    this.logger.debug(`Automação ${automation.id} já disparou para contato ${eventData.contactId}`);
                    continue;
                }
            }
            if (triggerType === 'INACTIVITY') {
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
        if (eventData.contactId) {
            await this.prisma.automationLog.create({
                data: {
                    tenantId: automation.tenantId,
                    automationId: automation.id,
                    contactId: eventData.contactId
                }
            });
        }
        const { actionType, actionData } = automation;
        const { contactId, tenantId } = automation;
        const cid = eventData.contactId;
        if (!cid)
            return;
        const contact = await this.prisma.contact.findUnique({ where: { id: cid } });
        if (!contact)
            return;
        try {
            if (actionType === 'SEND_MESSAGE') {
                const messageTpl = actionData.message || '';
                const finalMsg = messageTpl.replace('{{nome}}', contact.name);
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
            if (actionType === 'ADD_TAG') {
                const tag = actionData.tag;
                if (tag) {
                    const currentTags = contact.tags || [];
                    if (!currentTags.includes(tag)) {
                        await this.prisma.contact.update({
                            where: { id: cid },
                            data: { tags: [...currentTags, tag] }
                        });
                    }
                }
            }
            if (actionType === 'TRANSFER') {
                const departmentId = actionData.departmentId;
                const conv = await this.getOrCreateConversation(automation.tenantId, cid);
                if (departmentId && conv) {
                    await this.prisma.conversation.update({
                        where: { id: conv.id },
                        data: { departmentId, status: 'waiting', assignedTo: null }
                    });
                }
            }
            if (actionType === 'MOVE_STAGE') {
                const stage = actionData.stage;
                if (stage) {
                    const deal = await this.prisma.deal.findFirst({ where: { contactId: cid, tenantId: automation.tenantId }, orderBy: { createdAt: 'desc' } });
                    if (deal) {
                        await this.prisma.deal.update({ where: { id: deal.id }, data: { status: stage } });
                    }
                }
            }
        }
        catch (e) {
            this.logger.error(`Erro ao executar ação ${actionType} na automação ${automation.id}: ${e.message}`);
        }
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