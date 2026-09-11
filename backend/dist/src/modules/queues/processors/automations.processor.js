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
var AutomationsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationsProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const automations_service_1 = require("../../automations/automations.service");
const common_1 = require("@nestjs/common");
let AutomationsProcessor = AutomationsProcessor_1 = class AutomationsProcessor extends bullmq_1.WorkerHost {
    constructor(prisma, automationsService) {
        super();
        this.prisma = prisma;
        this.automationsService = automationsService;
        this.logger = new common_1.Logger(AutomationsProcessor_1.name);
    }
    async process(job) {
        this.logger.log(`Processando job de automação: ${job.name} (ID: ${job.id})`);
        const { tenantId, automationId, contactId, eventData } = job.data;
        try {
            const automation = await this.prisma.automation.findUnique({
                where: { id: automationId }
            });
            if (!automation || !automation.isActive) {
                this.logger.log(`Automação ${automationId} inativa ou não encontrada. Abortando.`);
                return;
            }
            if (automation.triggerType === 'INACTIVITY') {
                const contact = await this.prisma.contact.findUnique({ where: { id: contactId }, include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } } });
                if (contact && contact.messages.length > 0) {
                    const lastMsg = contact.messages[0];
                    if (lastMsg.direction === 'INBOUND' && eventData.triggeredAt && new Date(lastMsg.createdAt) > new Date(eventData.triggeredAt)) {
                        this.logger.log(`Lead respondeu antes do timeout. Automação Inatividade cancelada.`);
                        return;
                    }
                }
            }
            await this.automationsService.executeAction(automation, { ...eventData, contactId });
            return { status: 'success' };
        }
        catch (error) {
            this.logger.error(`Erro ao processar automação: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.AutomationsProcessor = AutomationsProcessor;
exports.AutomationsProcessor = AutomationsProcessor = AutomationsProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, bullmq_1.Processor)('automations'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        automations_service_1.AutomationsService])
], AutomationsProcessor);
//# sourceMappingURL=automations.processor.js.map