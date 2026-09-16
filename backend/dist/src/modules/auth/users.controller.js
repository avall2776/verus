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
const emails_service_1 = require("../emails/emails.service");
let UsersController = class UsersController {
    constructor(prisma, emailsService) {
        this.prisma = prisma;
        this.emailsService = emailsService;
    }
    async findAll(req) {
        return this.prisma.user.findMany({
            where: { tenantId: req.user.tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                avatarUrl: true,
                isOnline: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
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
                isActive: true,
                avatarUrl: true,
                tenantId: true,
            },
        });
    }
    async update(req, id, body) {
        const tenantId = req.user?.tenantId;
        const currentUserId = req.user?.id || req.user?.userId;
        const targetUser = await this.prisma.user.findFirst({
            where: { id, tenantId },
        });
        if (!targetUser) {
            throw new common_1.BadRequestException('Usuário não encontrado na sua empresa.');
        }
        const updateData = {};
        if (body.name !== undefined) {
            const name = body.name?.trim();
            if (!name) {
                throw new common_1.BadRequestException('Nome do usuário é obrigatório.');
            }
            updateData.name = name;
        }
        if (body.role !== undefined) {
            const role = body.role.toUpperCase();
            if (role !== 'ADMIN' && role !== 'AGENT') {
                throw new common_1.BadRequestException('Cargo inválido. Utilize ADMIN ou AGENT.');
            }
            if (id === currentUserId && role !== 'ADMIN') {
                const adminCount = await this.prisma.user.count({
                    where: { tenantId, role: 'ADMIN', isActive: true },
                });
                if (adminCount <= 1) {
                    throw new common_1.BadRequestException('Você é o único Administrador ativo da empresa e não pode alterar seu cargo para Atendente.');
                }
            }
            updateData.role = role;
        }
        if (body.isActive !== undefined) {
            if (id === currentUserId && body.isActive === false) {
                throw new common_1.BadRequestException('Você não pode desativar o seu próprio usuário.');
            }
            updateData.isActive = Boolean(body.isActive);
        }
        if (body.password) {
            const rawPass = body.password.trim();
            if (rawPass.length < 6) {
                throw new common_1.BadRequestException('A nova senha deve ter no mínimo 6 caracteres.');
            }
            const bcrypt = await Promise.resolve().then(() => require('bcrypt'));
            updateData.password = await bcrypt.hash(rawPass, 10);
        }
        if (body.avatarUrl !== undefined) {
            updateData.avatarUrl = body.avatarUrl;
        }
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                avatarUrl: true,
                isOnline: true,
                tenantId: true,
            },
        });
        return {
            message: 'Membro atualizado com sucesso!',
            user: updatedUser,
        };
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
        const role = (body.role || 'AGENT').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'AGENT';
        const newUser = await this.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                isActive: true,
                tenantId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                avatarUrl: true,
                isOnline: true,
            },
        });
        let emailSent = false;
        let emailError;
        try {
            const inviteRes = await this.emailsService.sendUserInvitationEmail({
                tenantId,
                recipientEmail: email,
                recipientName: name,
                role,
                initialPassword: rawPass,
                inviterName: req.user?.name || 'Administrador',
            });
            emailSent = inviteRes.sent;
            emailError = inviteRes.error;
        }
        catch (err) {
            emailError = err.message;
        }
        return {
            message: emailSent
                ? 'Membro cadastrado com sucesso! E-mail de convite enviado via SMTP.'
                : 'Membro cadastrado com sucesso! (Configure o Inbox de E-mails para envio automático de convites).',
            user: newUser,
            emailSent,
            emailError,
        };
    }
    async deleteUser(req, id) {
        const tenantId = req.user?.tenantId;
        const currentUserId = req.user?.id || req.user?.userId;
        if (id === currentUserId) {
            throw new common_1.BadRequestException('Você não pode excluir o seu próprio usuário.');
        }
        const targetUser = await this.prisma.user.findFirst({
            where: { id, tenantId },
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        emails_service_1.EmailsService])
], UsersController);
//# sourceMappingURL=users.controller.js.map