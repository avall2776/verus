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
const common_1 = require("@nestjs/common");
const automations_service_1 = require("./automations.service");
const prisma_service_1 = require("../../shared/database/prisma.service");
let AutomationsProcessor = AutomationsProcessor_1 = class AutomationsProcessor extends bullmq_1.WorkerHost {
    constructor(automationsService, prisma) {
        super();
        this.automationsService = automationsService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(AutomationsProcessor_1.name);
    }
    async process(job) {
        this.logger.log(`Processando job: ${job.name} (ID: ${job.id})`);
        if (job.name === 'processInactivity') {
            const { tenantId, automationId, contactId, eventData } = job.data;
            const automation = await this.prisma.automation.findUnique({ where: { id: automationId } });
            if (!automation || !automation.isActive) {
                this.logger.log(`Automação inativa ou deletada, abortando job.`);
                return;
            }
            const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
            if (!contact)
                return;
            const conv = await this.prisma.conversation.findUnique({
                where: { tenantId_contactId: { tenantId, contactId } }
            });
            if (conv) {
                const triggeredDate = new Date(eventData.triggeredAt);
                if (conv.updatedAt > triggeredDate) {
                    this.logger.log(`Lead respondeu ou teve movimentação, inatividade cancelada para ${contactId}.`);
                    return;
                }
            }
            this.logger.log(`Tempo limite de inatividade atingido. Executando ação para ${contactId}...`);
            await this.automationsService.executeAction(automation, eventData);
        }
    }
};
exports.AutomationsProcessor = AutomationsProcessor;
exports.AutomationsProcessor = AutomationsProcessor = AutomationsProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('automations'),
    __metadata("design:paramtypes", [automations_service_1.AutomationsService,
        prisma_service_1.PrismaService])
], AutomationsProcessor);
//# sourceMappingURL=automations.processor.js.map