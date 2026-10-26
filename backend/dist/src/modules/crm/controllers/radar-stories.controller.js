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
exports.RadarStoriesController = void 0;
const common_1 = require("@nestjs/common");
const radar_stories_service_1 = require("../services/radar-stories.service");
const jwt_auth_guard_1 = require("../../../shared/guards/jwt-auth.guard");
const plan_guard_1 = require("../../../shared/guards/plan.guard");
const require_module_decorator_1 = require("../../../shared/decorators/require-module.decorator");
const tenant_decorator_1 = require("../../../shared/decorators/tenant.decorator");
let RadarStoriesController = class RadarStoriesController {
    constructor(radarStoriesService) {
        this.radarStoriesService = radarStoriesService;
    }
    async getMetrics(tenantId) {
        return this.radarStoriesService.getMetrics(tenantId);
    }
    async getActivePosts(tenantId) {
        return this.radarStoriesService.getActivePosts(tenantId);
    }
    async updatePost(tenantId, postId, body) {
        return this.radarStoriesService.updatePost(tenantId, postId, body);
    }
    async updateViewerContact(tenantId, viewId, body) {
        return this.radarStoriesService.updateViewerContact(tenantId, viewId, body);
    }
    async exportMetaAudience(tenantId, body) {
        return this.radarStoriesService.exportMetaAudience(tenantId, body?.viewerIds);
    }
    async createCampaignFromViewers(tenantId, body) {
        return this.radarStoriesService.createCampaignFromViewers(tenantId, body);
    }
    async syncStories(tenantId) {
        return this.radarStoriesService.syncActiveStories(tenantId);
    }
    async getRecentViewersPhones(tenantId) {
        return this.radarStoriesService.getRecentViewersPhones(tenantId);
    }
    async getContactLatestView(tenantId, phone, contactId) {
        return this.radarStoriesService.getContactLatestView(tenantId, phone, contactId);
    }
    async publishStory(tenantId, body) {
        return this.radarStoriesService.publishStory(tenantId, body);
    }
    async getViewers(tenantId, status, category, search) {
        return this.radarStoriesService.getViewers(tenantId, { status, category, search });
    }
    async recordStatusView(tenantId, body) {
        return this.radarStoriesService.recordStatusView(tenantId, body);
    }
    async generateApproach(tenantId, body) {
        return this.radarStoriesService.generateApproach(tenantId, body);
    }
};
exports.RadarStoriesController = RadarStoriesController;
__decorate([
    (0, common_1.Get)('metrics'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RadarStoriesController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('active-posts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RadarStoriesController.prototype, "getActivePosts", null);
__decorate([
    (0, common_1.Patch)('posts/:id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], RadarStoriesController.prototype, "updatePost", null);
__decorate([
    (0, common_1.Patch)('viewers/:id/contact'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], RadarStoriesController.prototype, "updateViewerContact", null);
__decorate([
    (0, common_1.Post)('meta-audience/export'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RadarStoriesController.prototype, "exportMetaAudience", null);
__decorate([
    (0, common_1.Post)('campaigns/create'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RadarStoriesController.prototype, "createCampaignFromViewers", null);
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RadarStoriesController.prototype, "syncStories", null);
__decorate([
    (0, common_1.Get)('recent-viewers-phones'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RadarStoriesController.prototype, "getRecentViewersPhones", null);
__decorate([
    (0, common_1.Get)('contact-latest-view'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('phone')),
    __param(2, (0, common_1.Query)('contactId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], RadarStoriesController.prototype, "getContactLatestView", null);
__decorate([
    (0, common_1.Post)('publish'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RadarStoriesController.prototype, "publishStory", null);
__decorate([
    (0, common_1.Get)('viewers'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('category')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], RadarStoriesController.prototype, "getViewers", null);
__decorate([
    (0, common_1.Post)('record-view'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RadarStoriesController.prototype, "recordStatusView", null);
__decorate([
    (0, common_1.Post)('approach'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RadarStoriesController.prototype, "generateApproach", null);
exports.RadarStoriesController = RadarStoriesController = __decorate([
    (0, common_1.Controller)('crm/radar-stories'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('crm'),
    __metadata("design:paramtypes", [radar_stories_service_1.RadarStoriesService])
], RadarStoriesController);
//# sourceMappingURL=radar-stories.controller.js.map