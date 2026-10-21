"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgencyMarketingModule = void 0;
const common_1 = require("@nestjs/common");
const agency_marketing_controller_1 = require("./agency-marketing.controller");
const agency_marketing_service_1 = require("./agency-marketing.service");
const google_drive_sync_service_1 = require("./google-drive-sync.service");
const database_module_1 = require("../../shared/database/database.module");
const marketing_module_guard_1 = require("../../shared/guards/marketing-module.guard");
let AgencyMarketingModule = class AgencyMarketingModule {
};
exports.AgencyMarketingModule = AgencyMarketingModule;
exports.AgencyMarketingModule = AgencyMarketingModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [agency_marketing_controller_1.AgencyMarketingController],
        providers: [agency_marketing_service_1.AgencyMarketingService, google_drive_sync_service_1.GoogleDriveSyncService, marketing_module_guard_1.MarketingModuleGuard],
        exports: [agency_marketing_service_1.AgencyMarketingService, google_drive_sync_service_1.GoogleDriveSyncService, marketing_module_guard_1.MarketingModuleGuard],
    })
], AgencyMarketingModule);
//# sourceMappingURL=agency-marketing.module.js.map