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
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let SearchService = SearchService_1 = class SearchService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SearchService_1.name);
    }
    async globalSearch(tenantId, query) {
        if (!query || query.trim().length < 2) {
            return { leads: [], contacts: [], team: [], total: 0 };
        }
        const cleanQuery = query.trim();
        try {
            const [deals, contacts, teamUsers] = await Promise.all([
                this.prisma.deal.findMany({
                    where: {
                        tenantId,
                        OR: [
                            { title: { contains: cleanQuery, mode: 'insensitive' } },
                            { contact: { name: { contains: cleanQuery, mode: 'insensitive' } } },
                            { contact: { phone: { contains: cleanQuery, mode: 'insensitive' } } },
                            { contact: { email: { contains: cleanQuery, mode: 'insensitive' } } },
                        ],
                    },
                    take: 6,
                    orderBy: { updatedAt: 'desc' },
                    include: {
                        contact: {
                            select: { name: true, phone: true }
                        }
                    }
                }),
                this.prisma.contact.findMany({
                    where: {
                        tenantId,
                        OR: [
                            { name: { contains: cleanQuery, mode: 'insensitive' } },
                            { phone: { contains: cleanQuery, mode: 'insensitive' } },
                            { email: { contains: cleanQuery, mode: 'insensitive' } },
                        ],
                    },
                    take: 6,
                    orderBy: { updatedAt: 'desc' },
                    include: {
                        conversations: {
                            take: 1,
                            orderBy: { updatedAt: 'desc' },
                            select: { id: true, status: true, updatedAt: true }
                        }
                    }
                }),
                this.prisma.user.findMany({
                    where: {
                        tenantId,
                        isActive: true,
                        OR: [
                            { name: { contains: cleanQuery, mode: 'insensitive' } },
                            { email: { contains: cleanQuery, mode: 'insensitive' } },
                            { role: { contains: cleanQuery, mode: 'insensitive' } },
                        ],
                    },
                    take: 4,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        isOnline: true
                    }
                })
            ]);
            const formattedLeads = deals.map(d => ({
                id: d.id,
                title: d.title || d.contact?.name || 'Oportunidade',
                value: Number(d.value || 0),
                status: d.status,
                contactName: d.contact?.name || 'Sem contato',
                contactPhone: d.contact?.phone || undefined,
                href: `/crm`
            }));
            const formattedContacts = contacts.map(c => ({
                id: c.id,
                name: c.name || c.phone || 'Contato',
                phone: c.phone || '',
                email: c.email || undefined,
                conversationId: c.conversations?.[0]?.id,
                href: `/inbox`
            }));
            const formattedTeam = teamUsers.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email || undefined,
                role: u.role,
                isOnline: Boolean(u.isOnline),
                href: `/chat-interno`
            }));
            const total = formattedLeads.length + formattedContacts.length + formattedTeam.length;
            return {
                leads: formattedLeads,
                contacts: formattedContacts,
                team: formattedTeam,
                total
            };
        }
        catch (error) {
            this.logger.error('Erro ao executar busca global:', error);
            return { leads: [], contacts: [], team: [], total: 0 };
        }
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
//# sourceMappingURL=search.service.js.map