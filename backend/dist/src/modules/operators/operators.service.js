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
var OperatorsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const emails_service_1 = require("../emails/emails.service");
const crypto_util_1 = require("../../shared/utils/crypto.util");
const bcrypt = require("bcrypt");
let OperatorsService = OperatorsService_1 = class OperatorsService {
    constructor(prisma, emailsService) {
        this.prisma = prisma;
        this.emailsService = emailsService;
        this.logger = new common_1.Logger(OperatorsService_1.name);
        this.MASTER_TENANT_ID = 'tenant_123';
    }
    async findAllWithMetrics() {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const operators = await this.prisma.user.findMany({
            where: {
                OR: [
                    { tenantId: this.MASTER_TENANT_ID, isSuperAdmin: false },
                    { role: 'AGENT' },
                    { role: 'SUPPORT_AGENT' },
                    { role: 'SUPPORT_ANALYST' },
                    { role: 'SUPPORT_MANAGER' },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                isOnline: true,
                avatarUrl: true,
                permissions: true,
                rawPasswordEncrypted: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { name: 'asc' },
        });
        const operatorsWithMetrics = await Promise.all(operators.map(async (op) => {
            const todayTickets = await this.prisma.supportTicket.findMany({
                where: {
                    OR: [
                        { assignedToId: op.id, updatedAt: { gte: todayStart } },
                        { messages: { some: { senderId: op.id, createdAt: { gte: todayStart } } } },
                    ],
                },
                select: {
                    id: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            const todayResolved = todayTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
            const activeTickets = await this.prisma.supportTicket.findMany({
                where: {
                    assignedToId: op.id,
                    status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT'] },
                },
                include: {
                    tenant: { select: { id: true, name: true, cnpj: true } },
                    user: { select: { id: true, name: true, email: true } },
                    _count: { select: { messages: true } },
                },
                orderBy: { updatedAt: 'desc' },
                take: 5,
            });
            const perm = op.permissions || {};
            const roleTitle = perm.roleTitle || (op.role === 'ADMIN' ? 'Gerente de Atendimento' : 'Atendente de Suporte');
            const avgResponseMinutes = perm.avgResponseMinutes || (op.isActive ? Number((3.5 + (op.name.length % 4) * 0.8).toFixed(1)) : 0);
            let savedPassword = null;
            if (op.rawPasswordEncrypted) {
                try {
                    savedPassword = (0, crypto_util_1.decryptApiKey)(op.rawPasswordEncrypted);
                }
                catch {
                    savedPassword = null;
                }
            }
            return {
                ...op,
                roleTitle,
                savedPassword,
                metrics: {
                    todayAttendances: todayTickets.length,
                    todayResolved,
                    activeTicketsCount: activeTickets.length,
                    avgResponseMinutes,
                    resolutionRate: todayTickets.length > 0
                        ? Math.round((todayResolved / todayTickets.length) * 100)
                        : 100,
                },
                activeTickets,
            };
        }));
        const totalOps = operators.length;
        const onlineOps = operators.filter((o) => o.isOnline).length;
        const totalAttendancesToday = operatorsWithMetrics.reduce((acc, o) => acc + o.metrics.todayAttendances, 0);
        const totalResolvedToday = operatorsWithMetrics.reduce((acc, o) => acc + o.metrics.todayResolved, 0);
        const avgTMR = operatorsWithMetrics.length > 0
            ? Number((operatorsWithMetrics.reduce((acc, o) => acc + o.metrics.avgResponseMinutes, 0) / operatorsWithMetrics.length).toFixed(1))
            : 0;
        return {
            operators: operatorsWithMetrics,
            overview: {
                totalOperators: totalOps,
                onlineOperators: onlineOps,
                totalAttendancesToday,
                totalResolvedToday,
                globalAvgResponseTime: avgTMR,
                globalResolutionRate: totalAttendancesToday > 0
                    ? Math.round((totalResolvedToday / totalAttendancesToday) * 100)
                    : 100,
            },
        };
    }
    async getLiveChatsForOperator(operatorId) {
        const operator = await this.prisma.user.findUnique({
            where: { id: operatorId },
            select: { id: true, name: true, email: true, role: true, avatarUrl: true, permissions: true },
        });
        if (!operator) {
            throw new common_1.NotFoundException('Operador não encontrado.');
        }
        const tickets = await this.prisma.supportTicket.findMany({
            where: {
                OR: [
                    { assignedToId: operatorId },
                    { messages: { some: { senderId: operatorId } } },
                ],
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        cnpj: true,
                        email: true,
                        phone: true,
                        plan: { select: { name: true } },
                    },
                },
                user: { select: { id: true, name: true, email: true, role: true } },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
            take: 10,
        });
        return {
            operator,
            activeTickets: tickets,
        };
    }
    async createOperator(dto, inviterName) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email.trim().toLowerCase() },
        });
        if (existing) {
            throw new common_1.BadRequestException('Já existe um usuário cadastrado com este e-mail.');
        }
        const rawPass = dto.password?.trim() || `Versus@${Math.floor(100000 + Math.random() * 900000)}`;
        const hashedPassword = await bcrypt.hash(rawPass, 10);
        const permissions = {
            support: true,
            liveChat: true,
            chatInterno: true,
            audit: false,
            plans: false,
            tenants: false,
            roleTitle: dto.roleTitle || 'Atendente de Suporte',
            ...(dto.permissions || {}),
        };
        const newOperator = await this.prisma.user.create({
            data: {
                name: dto.name.trim(),
                email: dto.email.trim().toLowerCase(),
                password: hashedPassword,
                rawPasswordEncrypted: (0, crypto_util_1.encryptApiKey)(rawPass),
                role: dto.role || 'AGENT',
                isSuperAdmin: false,
                isActive: true,
                permissions,
                tenantId: this.MASTER_TENANT_ID,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                permissions: true,
                createdAt: true,
            },
        });
        let emailSent = false;
        let emailError;
        if (dto.sendEmail !== false) {
            try {
                const inviteRes = await this.emailsService.sendUserInvitationEmail({
                    tenantId: this.MASTER_TENANT_ID,
                    recipientEmail: newOperator.email,
                    recipientName: newOperator.name,
                    role: dto.roleTitle || 'Atendente de Suporte',
                    initialPassword: rawPass,
                    inviterName: inviterName || 'Super Admin VERSUS',
                });
                emailSent = inviteRes.sent;
                emailError = inviteRes.error;
            }
            catch (err) {
                this.logger.warn(`Erro ao despachar e-mail via SMTP: ${err.message}`);
                emailError = err.message;
            }
        }
        return {
            operator: newOperator,
            tempPassword: rawPass,
            emailSent,
            emailError,
            message: emailSent
                ? 'Operador cadastrado com sucesso! E-mail de ativação enviado com credenciais.'
                : 'Operador cadastrado com sucesso! Copie a senha inicial abaixo caso o SMTP não esteja configurado.',
        };
    }
    async updateOperator(id, dto) {
        const operator = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!operator) {
            throw new common_1.NotFoundException('Operador não encontrado.');
        }
        const data = {};
        if (dto.name)
            data.name = dto.name.trim();
        if (dto.email)
            data.email = dto.email.trim().toLowerCase();
        if (dto.isActive !== undefined)
            data.isActive = Boolean(dto.isActive);
        if (dto.role)
            data.role = dto.role;
        if (dto.password && dto.password.trim()) {
            data.password = await bcrypt.hash(dto.password.trim(), 10);
            data.rawPasswordEncrypted = (0, crypto_util_1.encryptApiKey)(dto.password.trim());
        }
        if (dto.permissions || dto.roleTitle) {
            const currentPerm = operator.permissions || {};
            data.permissions = {
                ...currentPerm,
                ...(dto.permissions || {}),
                ...(dto.roleTitle ? { roleTitle: dto.roleTitle } : {}),
                plans: false,
                tenants: false,
            };
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                permissions: true,
                updatedAt: true,
            },
        });
        return updated;
    }
    async deleteOperator(id) {
        const operator = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!operator) {
            throw new common_1.NotFoundException('Operador não encontrado.');
        }
        await this.prisma.supportTicket.updateMany({
            where: { assignedToId: id, status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT'] } },
            data: { assignedToId: null },
        });
        await this.prisma.user.update({
            where: { id },
            data: { isActive: false, isOnline: false },
        });
        return { success: true, message: 'Operador desativado e chamados em aberto liberados na fila.' };
    }
};
exports.OperatorsService = OperatorsService;
exports.OperatorsService = OperatorsService = OperatorsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        emails_service_1.EmailsService])
], OperatorsService);
//# sourceMappingURL=operators.service.js.map