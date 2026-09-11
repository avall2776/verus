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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let DepartmentsService = class DepartmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, name, color) {
        return this.prisma.department.create({
            data: { tenantId, name, color },
        });
    }
    async findAll(tenantId) {
        return this.prisma.department.findMany({
            where: { tenantId },
            include: {
                users: {
                    include: { user: true }
                }
            }
        });
    }
    async addUserToDepartment(tenantId, departmentId, userId) {
        const dept = await this.prisma.department.findFirst({
            where: { id: departmentId, tenantId }
        });
        if (!dept)
            throw new common_1.NotFoundException('Department not found');
        return this.prisma.userDepartment.create({
            data: { userId, departmentId }
        });
    }
    async removeUserFromDepartment(tenantId, departmentId, userId) {
        const dept = await this.prisma.department.findFirst({
            where: { id: departmentId, tenantId }
        });
        if (!dept)
            throw new common_1.NotFoundException('Department not found');
        return this.prisma.userDepartment.delete({
            where: {
                userId_departmentId: { userId, departmentId }
            }
        });
    }
    async update(tenantId, id, data) {
        return this.prisma.department.update({
            where: { id, tenantId },
            data,
        });
    }
    async delete(tenantId, id) {
        await this.prisma.userDepartment.deleteMany({
            where: { departmentId: id }
        });
        await this.prisma.conversation.updateMany({
            where: { departmentId: id, tenantId },
            data: { departmentId: null }
        });
        return this.prisma.department.delete({
            where: { id, tenantId }
        });
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map