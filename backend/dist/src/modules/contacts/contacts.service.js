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
var ContactsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const automations_service_1 = require("../automations/automations.service");
const google_contacts_service_1 = require("./google-contacts.service");
let ContactsService = ContactsService_1 = class ContactsService {
    constructor(prisma, automationsService, googleContactsService) {
        this.prisma = prisma;
        this.automationsService = automationsService;
        this.googleContactsService = googleContactsService;
        this.logger = new common_1.Logger(ContactsService_1.name);
        this.contactsCache = new Map();
    }
    async createContact(tenantId, data) {
        const contact = await this.prisma.contact.create({
            data: {
                tenantId,
                name: data.name.trim(),
                phone: data.phone?.trim() || null,
                email: data.email?.trim().toLowerCase() || null,
                source: data.source || 'Manual',
                tags: data.tags || ['Lead'],
            },
        });
        this.contactsCache.delete(tenantId);
        if (contact.phone) {
            this.googleContactsService.syncContact(tenantId, contact).catch((err) => {
                this.logger.warn(`Erro ao sincronizar novo contato com Google: ${err.message}`);
            });
        }
        return contact;
    }
    async findAll(tenantId) {
        const cached = this.contactsCache.get(tenantId);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.data;
        }
        const contacts = await this.prisma.contact.findMany({
            where: { tenantId },
            orderBy: { updatedAt: 'desc' },
            include: {
                deals: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        value: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                }
            }
        });
        const result = contacts.map(c => {
            let tags = Array.isArray(c.tags) ? [...c.tags] : [];
            const deals = c.deals || [];
            const wonDeals = deals.filter(d => d.status === 'won');
            const hasWonDeal = wonDeals.length > 0 || c.isFaturado;
            const isClient = tags.some(t => t.toLowerCase() === 'cliente') || hasWonDeal;
            const activeDeals = deals.filter(d => ['new', 'qualified', 'follow-up', 'proposal', 'negotiation', 'seed', 'ligacao-ativa'].includes(d.status));
            const hasActiveDeals = activeDeals.length > 0;
            const lostDeals = deals.filter(d => ['lost', 'disqualified'].includes(d.status));
            const hasOnlyLostDeals = deals.length > 0 && lostDeals.length === deals.length;
            let statusCategory = 'cold';
            if (tags.some(t => t.toLowerCase() === 'colaborador')) {
                statusCategory = 'collaborator';
            }
            else if (tags.some(t => t.toLowerCase() === 'parceiro')) {
                statusCategory = 'partner';
            }
            else if (isClient) {
                statusCategory = 'won';
                if (!tags.includes('Cliente')) {
                    tags.unshift('Cliente');
                }
                tags = tags.filter(t => t !== 'Frio' && t !== 'Não categorizado');
            }
            else if (hasActiveDeals || tags.some(t => ['quente', 'lead qualificado'].includes(t.toLowerCase()))) {
                statusCategory = 'hot';
                if (!tags.includes('Quente')) {
                    tags.unshift('Quente');
                }
                tags = tags.filter(t => t !== 'Frio' && t !== 'Não categorizado');
            }
            else if (hasOnlyLostDeals || tags.some(t => t.toLowerCase().includes('desqualificado'))) {
                statusCategory = 'lost';
            }
            else {
                statusCategory = 'cold';
                if (!tags.includes('Frio') && !tags.some(t => ['Cliente', 'Quente', 'Lead'].includes(t))) {
                    tags.push('Frio');
                }
            }
            if (tags.length > 1 && tags.includes('Não categorizado')) {
                tags = tags.filter(t => t !== 'Não categorizado');
            }
            const dealsWonValue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
            const totalWonValue = dealsWonValue > 0 ? dealsWonValue : (Number(c.totalFaturado) || 0);
            const totalActivePipelineValue = activeDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
            let avatarUrl = c.avatarUrl;
            if (!avatarUrl || avatarUrl === 'null' || avatarUrl === 'undefined' || avatarUrl.includes('unsplash.com')) {
                avatarUrl = null;
            }
            const cleanSource = (c.source || 'Vallor CRM')
                .replace(/lero\s*/gi, 'Vallor ')
                .replace(/versus\s*/gi, 'Vallor ')
                .trim();
            return {
                id: c.id,
                name: c.name,
                phone: c.phone,
                email: c.email,
                cpfCnpj: c.cpfCnpj,
                razaoSocial: c.razaoSocial,
                nomeFantasia: c.nomeFantasia,
                inscricaoEstadual: c.inscricaoEstadual,
                cep: c.cep,
                address: c.address,
                number: c.number,
                complement: c.complement,
                neighborhood: c.neighborhood,
                city: c.city,
                state: c.state,
                isFaturado: c.isFaturado,
                totalFaturado: Number(c.totalFaturado) || 0,
                dataHealthScore: c.dataHealthScore || 0,
                source: cleanSource,
                avatarUrl,
                tags,
                statusCategory,
                isClient,
                dealsCount: deals.length,
                totalWonValue,
                totalActivePipelineValue,
                deals: deals.map(d => ({
                    id: d.id,
                    title: d.title,
                    status: d.status,
                    value: Number(d.value) || 0,
                    createdAt: d.createdAt,
                    updatedAt: d.updatedAt
                })),
                lastActive: c.updatedAt.toISOString(),
                createdAt: c.createdAt.toISOString()
            };
        });
        this.contactsCache.set(tenantId, { data: result, expiresAt: Date.now() + 20000 });
        return result;
    }
    async updateTags(tenantId, contactId, tags) {
        this.contactsCache.delete(tenantId);
        const contact = await this.prisma.contact.update({
            where: { id: contactId, tenantId },
            data: { tags }
        });
        if (tags && tags.length > 0) {
            for (const tag of tags) {
                await this.automationsService.evaluateEvent(tenantId, 'TAG_ADDED', { contactId, tag });
            }
        }
        return contact;
    }
    async updateContact(tenantId, contactId, data) {
        this.contactsCache.delete(tenantId);
        const existing = await this.prisma.contact.findFirst({
            where: { id: contactId, tenantId },
        });
        const updateData = {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.cpfCnpj !== undefined && { cpfCnpj: data.cpfCnpj }),
            ...(data.razaoSocial !== undefined && { razaoSocial: data.razaoSocial }),
            ...(data.nomeFantasia !== undefined && { nomeFantasia: data.nomeFantasia }),
            ...(data.inscricaoEstadual !== undefined && { inscricaoEstadual: data.inscricaoEstadual }),
            ...(data.cep !== undefined && { cep: data.cep }),
            ...(data.address !== undefined && { address: data.address }),
            ...(data.number !== undefined && { number: data.number }),
            ...(data.complement !== undefined && { complement: data.complement }),
            ...(data.neighborhood !== undefined && { neighborhood: data.neighborhood }),
            ...(data.city !== undefined && { city: data.city }),
            ...(data.state !== undefined && { state: data.state }),
        };
        if (data.phone && existing?.phone && existing.phone.includes('@lid') && !existing.whatsappLid) {
            updateData.whatsappLid = existing.phone;
        }
        const phoneVal = data.phone !== undefined ? data.phone : existing?.phone;
        const cpfVal = data.cpfCnpj !== undefined ? data.cpfCnpj : existing?.cpfCnpj;
        const addrVal = data.address !== undefined ? data.address : existing?.address;
        const cepVal = data.cep !== undefined ? data.cep : existing?.cep;
        const emailVal = data.email !== undefined ? data.email : existing?.email;
        let score = 0;
        if (phoneVal && phoneVal.replace(/\D/g, '').length >= 8)
            score += 25;
        if (cpfVal && cpfVal.replace(/\D/g, '').length >= 11)
            score += 25;
        if ((addrVal && addrVal.length >= 3) || (cepVal && cepVal.replace(/\D/g, '').length === 8))
            score += 25;
        if (emailVal && emailVal.includes('@'))
            score += 25;
        updateData.dataHealthScore = score;
        const contact = await this.prisma.contact.update({
            where: { id: contactId, tenantId },
            data: updateData,
        });
        if (contact.phone) {
            this.googleContactsService.syncContact(tenantId, contact).catch((err) => {
                this.logger.warn(`Erro ao sincronizar contato atualizado com Google: ${err.message}`);
            });
        }
        return contact;
    }
    async generateVcf(tenantId) {
        const contacts = await this.prisma.contact.findMany({
            where: { tenantId },
            select: { id: true, name: true, phone: true, email: true, address: true, whatsappLid: true },
            orderBy: { createdAt: 'desc' },
        });
        const vcards = [];
        for (const c of contacts) {
            const digits = (c.phone || '').replace(/\D/g, '');
            if (digits.startsWith('12036'))
                continue;
            const formatted = this.googleContactsService.sanitizePhone(c.phone);
            const displayName = this.googleContactsService.formatDisplayName(c.name, formatted || c.email || 'Cliente');
            let vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
            vcard += `FN:${displayName}\r\n`;
            vcard += `N:;${displayName};;;\r\n`;
            vcard += 'ORG:Verto Soluções Agrícolas\r\n';
            if (formatted) {
                vcard += `TEL;TYPE=CELL:${formatted}\r\n`;
                if (c.phone && c.phone.includes('@lid')) {
                    vcard += `NOTE:WhatsApp LID: ${c.phone}\r\n`;
                }
            }
            if (c.email)
                vcard += `EMAIL:${c.email.trim()}\r\n`;
            if (c.address)
                vcard += `NOTE:Endereço: ${c.address.replace(/[\r\n;]/g, ' ')}\r\n`;
            vcard += 'END:VCARD\r\n';
            vcards.push(vcard);
        }
        return vcards.join('');
    }
};
exports.ContactsService = ContactsService;
exports.ContactsService = ContactsService = ContactsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        automations_service_1.AutomationsService,
        google_contacts_service_1.GoogleContactsService])
], ContactsService);
//# sourceMappingURL=contacts.service.js.map