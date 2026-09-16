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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
let UsersController = class UsersController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(req) {
        return this.prisma.user.findMany({
            where: { tenantId: req.user.tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                isOnline: true
            }
        });
    }
    async updateProfile(req, body) {
        const userId = req.user?.id || req.user?.userId;
        if (!userId) {
            throw new common_1.BadRequestException('ID de usuário não identificado no token.');
        }
        const updateData = {};
        if (body.name !== undefined) {
            const name = body.name?.trim();
            if (!name) {
                throw new common_1.BadRequestException('Nome do usuário é obrigatório.');
            }
            updateData.name = name;
        }
        if (body.avatarUrl !== undefined) {
            updateData.avatarUrl = body.avatarUrl;
        }
        return this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                tenantId: true
            }
        });
    }
    async update(req, id, body) {
        const updateData = {};
        if (body.name !== undefined) {
            const name = body.name?.trim();
            if (!name) {
                throw new common_1.BadRequestException('Nome do usuário é obrigatório.');
            }
            updateData.name = name;
        }
        if (body.avatarUrl !== undefined) {
            updateData.avatarUrl = body.avatarUrl;
        }
        return this.prisma.user.update({
            where: { id: id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                tenantId: true
            }
        });
    }
    async create(req, body) {
        const tenantId = req.user?.tenantId;
        if (!tenantId)
            throw new common_1.BadRequestException('Tenant não identificado.');
        const name = body.name?.trim();
        const email = body.email?.trim().toLowerCase();
        if (!name || !email) {
            throw new common_1.BadRequestException('Nome e e-mail são obrigatórios.');
        }
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new common_1.BadRequestException('Este e-mail já está cadastrado no sistema.');
        }
        const rawPass = body.password?.trim() || 'Versus@123';
        const bcrypt = await Promise.resolve().then(() => require('bcrypt'));
        const hashedPassword = await bcrypt.hash(rawPass, 10);
        const role = (body.role || 'AGENT').toUpperCase();
        const newUser = await this.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role === 'ADMIN' ? 'ADMIN' : 'AGENT',
                tenantId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                isOnline: true,
            }
        });
        return {
            message: 'Usuário cadastrado com sucesso!',
            user: newUser,
        };
    }
    async deleteUser(req, id) {
        const tenantId = req.user?.tenantId;
        const currentUserId = req.user?.id || req.user?.userId;
        if (id === currentUserId) {
            throw new common_1.BadRequestException('Você não pode excluir o seu próprio usuário.');
        }
        const targetUser = await this.prisma.user.findFirst({
            where: { id, tenantId }
        });
        if (!targetUser) {
            throw new common_1.BadRequestException('Usuário não encontrado na sua empresa.');
        }
        await this.prisma.user.delete({ where: { id } });
        return {
            message: `Usuário '${targetUser.name}' excluído com sucesso.`,
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, common_1.Put)('profile'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteUser", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersController);
//# sourceMappingURL=users.controller.js.map