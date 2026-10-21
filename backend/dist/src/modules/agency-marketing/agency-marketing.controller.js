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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgencyMarketingController = void 0;
const common_1 = require("@nestjs/common");
const agency_marketing_service_1 = require("./agency-marketing.service");
const create_marketing_card_dto_1 = require("./dto/create-marketing-card.dto");
const update_marketing_card_dto_1 = require("./dto/update-marketing-card.dto");
const create_marketing_client_dto_1 = require("./dto/create-marketing-client.dto");
const update_marketing_client_dto_1 = require("./dto/update-marketing-client.dto");
const create_marketing_campaign_dto_1 = require("./dto/create-marketing-campaign.dto");
const update_marketing_campaign_dto_1 = require("./dto/update-marketing-campaign.dto");
const time_clock_dto_1 = require("./dto/time-clock.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../shared/guards/tenant.guard");
const marketing_module_guard_1 = require("../../shared/guards/marketing-module.guard");
const tenant_decorator_1 = require("../../shared/decorators/tenant.decorator");
const prisma_service_1 = require("../../shared/database/prisma.service");
const google_drive_sync_service_1 = require("./google-drive-sync.service");
let AgencyMarketingController = class AgencyMarketingController {
    constructor(marketingService, driveSyncService, prisma) {
        this.marketingService = marketingService;
        this.driveSyncService = driveSyncService;
        this.prisma = prisma;
    }
    async getCards(tenantId, clientId, status, search) {
        return this.marketingService.getCards(tenantId, { clientId, status, search });
    }
    async createCard(tenantId, dto) {
        return this.marketingService.createCard(tenantId, dto);
    }
    async reorderCards(tenantId, body) {
        return this.marketingService.reorderCards(tenantId, body.items || []);
    }
    async updateCard(tenantId, id, dto) {
        return this.marketingService.updateCard(tenantId, id, dto);
    }
    async deleteCard(tenantId, id) {
        return this.marketingService.deleteCard(tenantId, id);
    }
    async getClients(tenantId) {
        return this.marketingService.getClients(tenantId);
    }
    async createClient(tenantId, dto) {
        return this.marketingService.createClient(tenantId, dto);
    }
    async updateClient(tenantId, id, dto) {
        return this.marketingService.updateClient(tenantId, id, dto);
    }
    async deleteClient(tenantId, id) {
        return this.marketingService.deleteClient(tenantId, id);
    }
    async getClientById(tenantId, id) {
        return this.marketingService.getClientPieces(tenantId, id);
    }
    async getClientPieces(tenantId, id) {
        return this.marketingService.getClientPieces(tenantId, id);
    }
    async getCampaigns(tenantId, clientId, platform, status) {
        return this.marketingService.getCampaigns(tenantId, { clientId, platform, status });
    }
    async getTrafficSummary(tenantId) {
        return this.marketingService.getTrafficSummary(tenantId);
    }
    async createCampaign(tenantId, dto) {
        return this.marketingService.createCampaign(tenantId, dto);
    }
    async updateCampaign(tenantId, id, dto) {
        return this.marketingService.updateCampaign(tenantId, id, dto);
    }
    async deleteCampaign(tenantId, id) {
        return this.marketingService.deleteCampaign(tenantId, id);
    }
    async getSchedule(tenantId, start, end, clientId) {
        return this.marketingService.getSchedule(tenantId, start, end, clientId);
    }
    async logTime(tenantId, req, dto) {
        const userId = req.user?.id || req.user?.userId;
        const ipAddress = req.headers['x-forwarded-for'] ||
            req.headers['x-real-ip'] ||
            req.socket?.remoteAddress ||
            '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'Browser Client';
        return this.marketingService.logTime(tenantId, userId, dto, String(ipAddress), String(userAgent));
    }
    async getTodayTimeStatus(tenantId, req) {
        const userId = req.user?.id || req.user?.userId;
        return this.marketingService.getTodayTimeStatus(tenantId, userId);
    }
    async getTimeHistory(tenantId, userId, limit) {
        return this.marketingService.getTimeHistory(tenantId, userId, limit ? parseInt(limit, 10) : 50);
    }
    async getTeamMembers(tenantId) {
        return this.prisma.user.findMany({
            where: {
                tenantId,
                isActive: true,
                isSuperAdmin: false,
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
                canAccessMarketing: true,
            },
            orderBy: { name: 'asc' },
        });
    }
    async getDriveConfig(tenantId) {
        return this.driveSyncService.getSyncConfig(tenantId);
    }
    async saveDriveConfig(tenantId, body) {
        return this.driveSyncService.saveSyncConfig(tenantId, body);
    }
    async syncDrive(tenantId, body) {
        return this.driveSyncService.syncTenantDrive(tenantId, body);
    }
};
exports.AgencyMarketingController = AgencyMarketingController;
__decorate([
    (0, common_1.Get)('cards'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('clientId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "getCards", null);
__decorate([
    (0, common_1.Post)('cards'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_marketing_card_dto_1.CreateMarketingCardDto]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "createCard", null);
__decorate([
    (0, common_1.Patch)('cards/reorder'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "reorderCards", null);
__decorate([
    (0, common_1.Patch)('cards/:id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_marketing_card_dto_1.UpdateMarketingCardDto]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "updateCard", null);
__decorate([
    (0, common_1.Delete)('cards/:id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "deleteCard", null);
__decorate([
    (0, common_1.Get)('clients'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "getClients", null);
__decorate([
    (0, common_1.Post)('clients'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_marketing_client_dto_1.CreateMarketingClientDto]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "createClient", null);
__decorate([
    (0, common_1.Patch)('clients/:id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_marketing_client_dto_1.UpdateMarketingClientDto]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "updateClient", null);
__decorate([
    (0, common_1.Delete)('clients/:id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "deleteClient", null);
__decorate([
    (0, common_1.Get)('clients/:id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "getClientById", null);
__decorate([
    (0, common_1.Get)('clients/:id/pieces'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "getClientPieces", null);
__decorate([
    (0, common_1.Get)('campaigns'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('clientId')),
    __param(2, (0, common_1.Query)('platform')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "getCampaigns", null);
__decorate([
    (0, common_1.Get)('campaigns/summary'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "getTrafficSummary", null);
__decorate([
    (0, common_1.Post)('campaigns'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_marketing_campaign_dto_1.CreateMarketingCampaignDto]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "createCampaign", null);
__decorate([
    (0, common_1.Patch)('campaigns/:id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_marketing_campaign_dto_1.UpdateMarketingCampaignDto]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "updateCampaign", null);
__decorate([
    (0, common_1.Delete)('campaigns/:id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "deleteCampaign", null);
__decorate([
    (0, common_1.Get)('schedule'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('start')),
    __param(2, (0, common_1.Query)('end')),
    __param(3, (0, common_1.Query)('clientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "getSchedule", null);
__decorate([
    (0, common_1.Post)('time-clock'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, time_clock_dto_1.TimeClockDto]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "logTime", null);
__decorate([
    (0, common_1.Get)('time-clock/today'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "getTodayTimeStatus", null);
__decorate([
    (0, common_1.Get)('time-clock/history'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "getTimeHistory", null);
__decorate([
    (0, common_1.Get)('team'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "getTeamMembers", null);
__decorate([
    (0, common_1.Get)('drive/config'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "getDriveConfig", null);
__decorate([
    (0, common_1.Post)('drive/config'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "saveDriveConfig", null);
__decorate([
    (0, common_1.Post)('drive/sync'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgencyMarketingController.prototype, "syncDrive", null);
exports.AgencyMarketingController = AgencyMarketingController = __decorate([
    (0, common_1.Controller)(['agency/marketing', 'api/agency/marketing']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, marketing_module_guard_1.MarketingModuleGuard),
    __metadata("design:paramtypes", [agency_marketing_service_1.AgencyMarketingService,
        google_drive_sync_service_1.GoogleDriveSyncService,
        prisma_service_1.PrismaService])
], AgencyMarketingController);
//# sourceMappingURL=agency-marketing.controller.js.map