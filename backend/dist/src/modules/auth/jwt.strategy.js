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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../../shared/database/prisma.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
                passport_jwt_1.ExtractJwt.fromUrlQueryParameter('token'),
            ]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'super-secret-key-change-me',
        });
        this.prisma = prisma;
    }
    async validate(payload) {
        const userId = payload?.sub || payload?.id || payload?.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException({
                code: 'INVALID_TOKEN',
                message: 'Token inválido: identificador de usuário ausente.',
            });
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                isSuperAdmin: true,
                tenantId: true,
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                        planId: true,
                        plan: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                hasCRM: true,
                                hasWhatsApp: true,
                                hasInstagram: true,
                                hasAIAgent: true,
                                maxUsers: true,
                                maxAIMsgs: true,
                                maxWorkspaces: true,
                                modules: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            const sa = await this.prisma.superAdmin.findUnique({ where: { id: userId } });
            if (sa) {
                return {
                    id: sa.id,
                    userId: sa.id,
                    email: sa.email,
                    role: 'SUPER_ADMIN',
                    isSuperAdmin: true,
                    tenantId: null,
                    tenant: null,
                    plan: null,
                };
            }
            throw new common_1.UnauthorizedException({
                code: 'USER_NOT_FOUND',
                message: 'Token inválido: Usuário não encontrado no sistema.',
            });
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException({
                code: 'USER_INACTIVE',
                message: 'Sua conta de usuário foi desativada pelo administrador.',
            });
        }
        const isSuperAdmin = Boolean(user.isSuperAdmin === true ||
            String(user.role).toUpperCase() === 'SUPER_ADMIN' ||
            String(user.role).toUpperCase() === 'SUPERADMIN');
        if (!isSuperAdmin) {
            if (!user.tenant) {
                throw new common_1.UnauthorizedException({
                    code: 'TENANT_NOT_FOUND',
                    message: 'Acesso negado: Nenhuma empresa vinculada a este usuário.',
                });
            }
            if (!user.tenant.isActive) {
                throw new common_1.UnauthorizedException({
                    code: 'TENANT_BLOCKED',
                    message: `O acesso da empresa '${user.tenant.name}' está suspenso pela administração do VERSUS. Acesso bloqueado.`,
                });
            }
        }
        return {
            id: user.id,
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isSuperAdmin,
            tenantId: user.tenantId,
            tenant: user.tenant,
            plan: user.tenant?.plan || null,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map