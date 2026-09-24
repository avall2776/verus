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
exports.QuickRepliesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let QuickRepliesService = class QuickRepliesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        let replies = await this.prisma.quickReply.findMany({
            where: { tenantId },
            orderBy: { shortcut: 'asc' }
        });
        if (replies.length === 0) {
            const defaults = [
                { shortcut: '/ola', content: 'Olá! Como posso ajudar você hoje?' },
                { shortcut: '/catalogo', content: 'Confira nosso catálogo de produtos e serviços em nosso link oficial: https://catalogo.com' },
                { shortcut: '/pix', content: 'Nossa chave PIX para pagamentos é: cnpj 00.000.000/0001-00' },
                { shortcut: '/horario', content: 'Nosso horário de atendimento é de segunda a sexta, das 08h às 18h.' }
            ];
            for (const d of defaults) {
                try {
                    await this.prisma.quickReply.create({
                        data: {
                            tenantId,
                            shortcut: d.shortcut,
                            content: d.content
                        }
                    });
                }
                catch {
                }
            }
            replies = await this.prisma.quickReply.findMany({
                where: { tenantId },
                orderBy: { shortcut: 'asc' }
            });
        }
        return replies;
    }
    async create(tenantId, shortcut, content) {
        const formattedShortcut = shortcut.startsWith('/') ? shortcut : `/${shortcut}`;
        return this.prisma.quickReply.create({
            data: {
                tenantId,
                shortcut: formattedShortcut,
                content
            }
        });
    }
    async update(tenantId, id, data) {
        if (data.shortcut && !data.shortcut.startsWith('/')) {
            data.shortcut = `/${data.shortcut}`;
        }
        return this.prisma.quickReply.update({
            where: { id, tenantId },
            data
        });
    }
    async delete(tenantId, id) {
        return this.prisma.quickReply.delete({
            where: { id, tenantId }
        });
    }
};
exports.QuickRepliesService = QuickRepliesService;
exports.QuickRepliesService = QuickRepliesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuickRepliesService);
//# sourceMappingURL=quick-replies.service.js.map