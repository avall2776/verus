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
exports.ContactsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let ContactsService = class ContactsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        const contacts = await this.prisma.contact.findMany({
            where: { tenantId },
            orderBy: { updatedAt: 'desc' },
            include: {
                deals: true
            }
        });
        return contacts.map(c => {
            let tags = c.tags || [];
            if (c.deals.length > 0 && !tags.includes('Quente')) {
                tags.push('Quente');
            }
            else if (c.deals.length === 0 && !tags.includes('Frio')) {
                tags.push('Frio');
            }
            return {
                id: c.id,
                name: c.name,
                phone: c.phone,
                email: c.email,
                source: c.source,
                tags,
                lastActive: c.updatedAt.toISOString()
            };
        });
    }
};
exports.ContactsService = ContactsService;
exports.ContactsService = ContactsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContactsService);
//# sourceMappingURL=contacts.service.js.map