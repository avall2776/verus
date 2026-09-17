"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineeringModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const engineering_controller_1 = require("./engineering.controller");
const engineering_service_1 = require("./engineering.service");
let EngineeringModule = class EngineeringModule {
};
exports.EngineeringModule = EngineeringModule;
exports.EngineeringModule = EngineeringModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        controllers: [engineering_controller_1.EngineeringController],
        providers: [engineering_service_1.EngineeringService],
        exports: [engineering_service_1.EngineeringService],
    })
], EngineeringModule);
//# sourceMappingURL=engineering.module.js.map