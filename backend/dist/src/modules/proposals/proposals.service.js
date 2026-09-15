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
exports.ProposalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const client_1 = require("@prisma/client");
let ProposalsService = class ProposalsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    formatProposal(p) {
        if (!p)
            return null;
        const totalVal = Number(p.totalValue || 0);
        const discVal = Number(p.discountTotal || 0);
        const subtotal = totalVal + discVal;
        const formattedItems = (p.items || []).map((item) => ({
            id: item.id,
            name: item.name || item.description,
            description: item.description,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice || 0),
            discountPercent: Number(item.discountPercent || 0),
            total: Number(item.totalPrice || 0),
            totalPrice: Number(item.totalPrice || 0),
        }));
        return {
            ...p,
            id: p.id,
            code: p.code || `PROP-${p.id.slice(0, 8).toUpperCase()}`,
            title: p.title,
            clientName: p.clientName || p.lead?.name || 'Cliente',
            clientCompany: p.clientCompany || undefined,
            clientEmail: p.clientEmail || p.lead?.email || '',
            clientPhone: p.clientPhone || p.lead?.phone || '',
            sellerName: p.sellerName || 'Equipe Comercial',
            status: (p.status || 'DRAFT').toLowerCase(),
            totalValue: totalVal,
            total: totalVal,
            subtotal: subtotal,
            discountTotal: discVal,
            paymentMethod: p.paymentMethod || p.paymentTerms || '50% Entrada + 50% na Entrega',
            paymentTerms: p.paymentTerms,
            validUntil: p.validUntil ? new Date(p.validUntil).toISOString() : null,
            notes: p.notes || '',
            publicLink: `https://app.versus.com.br/p/${(p.code || p.id).toLowerCase()}`,
            items: formattedItems,
            issuer: p.tenant ? {
                name: p.tenant.name || '',
                document: p.tenant.cnpj || '',
                phone: p.tenant.phone || '',
                email: p.tenant.email || '',
                address: p.tenant.address || '',
                logoUrl: p.tenant.logoUrl || '',
            } : undefined,
        };
    }
    async findAll(tenantId, status) {
        const where = { tenantId };
        if (status && status !== 'all') {
            where.status = { equals: status, mode: 'insensitive' };
        }
        const proposals = await this.prisma.proposal.findMany({
            where,
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        cnpj: true,
                        logoUrl: true,
                        phone: true,
                        address: true,
                        email: true,
                    },
                },
                lead: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                deal: {
                    select: {
                        id: true,
                        title: true,
                        value: true,
                        status: true,
                    },
                },
                items: true,
                contracts: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return proposals.map((p) => this.formatProposal(p));
    }
    async findOne(tenantId, id) {
        const proposal = await this.prisma.proposal.findFirst({
            where: { id, tenantId },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        cnpj: true,
                        logoUrl: true,
                        phone: true,
                        address: true,
                        email: true,
                    },
                },
                lead: true,
                deal: true,
                items: true,
                contracts: true,
            },
        });
        if (!proposal) {
            throw new common_1.NotFoundException('Proposta não encontrada');
        }
        return this.formatProposal(proposal);
    }
    async create(tenantId, dto) {
        let leadId = dto.leadId || null;
        if (!leadId && (dto.clientPhone || dto.clientEmail || dto.clientName)) {
            try {
                const phoneClean = dto.clientPhone?.replace(/\D/g, '');
                const existingContact = await this.prisma.contact.findFirst({
                    where: {
                        tenantId,
                        OR: [
                            phoneClean ? { phone: { contains: phoneClean } } : undefined,
                            dto.clientEmail ? { email: dto.clientEmail } : undefined,
                        ].filter(Boolean),
                    },
                });
                if (existingContact) {
                    leadId = existingContact.id;
                }
                else if (dto.clientName) {
                    const newContact = await this.prisma.contact.create({
                        data: {
                            tenant: { connect: { id: tenantId } },
                            name: dto.clientName,
                            phone: dto.clientPhone || null,
                            email: dto.clientEmail || null,
                            source: 'Proposta Comercial',
                            tags: ['Proposta'],
                        },
                    });
                    leadId = newContact.id;
                }
            }
            catch (err) {
            }
        }
        let calculatedTotal = 0;
        const itemsData = (dto.items || []).map((item) => {
            const q = item.quantity || 1;
            const u = Number(item.unitPrice) || 0;
            const t = item.total ? Number(item.total) : q * u;
            calculatedTotal += t;
            return {
                name: item.name || item.description || 'Item',
                description: item.description || item.name || 'Item de Proposta',
                quantity: q,
                unitPrice: new client_1.Prisma.Decimal(u),
                discountPercent: item.discountPercent ? new client_1.Prisma.Decimal(item.discountPercent) : new client_1.Prisma.Decimal(0),
                totalPrice: new client_1.Prisma.Decimal(t),
            };
        });
        const finalTotal = dto.total !== undefined ? Number(dto.total) : calculatedTotal;
        const code = dto.code || `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const proposal = await this.prisma.proposal.create({
            data: {
                tenantId,
                code,
                title: dto.title || 'Proposta Comercial',
                clientName: dto.clientName || null,
                clientCompany: dto.clientCompany || null,
                clientEmail: dto.clientEmail || null,
                clientPhone: dto.clientPhone || null,
                sellerName: dto.sellerName || 'Equipe Comercial',
                leadId,
                dealId: dto.dealId || null,
                validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
                paymentTerms: dto.paymentTerms || null,
                paymentMethod: dto.paymentMethod || null,
                notes: dto.notes || null,
                totalValue: new client_1.Prisma.Decimal(finalTotal),
                discountTotal: new client_1.Prisma.Decimal(Number(dto.discountTotal || 0)),
                status: (dto.status || 'DRAFT').toUpperCase(),
                items: {
                    create: itemsData,
                },
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        cnpj: true,
                        logoUrl: true,
                        phone: true,
                        address: true,
                        email: true,
                    },
                },
                lead: true,
                deal: true,
                items: true,
            },
        });
        return this.formatProposal(proposal);
    }
    async update(tenantId, id, dto) {
        const existing = await this.prisma.proposal.findFirst({
            where: { id, tenantId },
            include: { items: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Proposta não encontrada');
        }
        return this.prisma.$transaction(async (tx) => {
            let totalValue = existing.totalValue;
            if (dto.items) {
                await tx.proposalItem.deleteMany({
                    where: { proposalId: existing.id },
                });
                let calculatedTotal = 0;
                const itemsData = dto.items.map((item) => {
                    const q = item.quantity || 1;
                    const u = Number(item.unitPrice) || 0;
                    const t = item.total ? Number(item.total) : q * u;
                    calculatedTotal += t;
                    return {
                        proposalId: existing.id,
                        name: item.name || item.description || 'Item',
                        description: item.description || item.name || 'Item de Proposta',
                        quantity: q,
                        unitPrice: new client_1.Prisma.Decimal(u),
                        discountPercent: item.discountPercent ? new client_1.Prisma.Decimal(item.discountPercent) : new client_1.Prisma.Decimal(0),
                        totalPrice: new client_1.Prisma.Decimal(t),
                    };
                });
                if (itemsData.length > 0) {
                    await tx.proposalItem.createMany({
                        data: itemsData,
                    });
                }
                totalValue = new client_1.Prisma.Decimal(dto.total !== undefined ? Number(dto.total) : calculatedTotal);
            }
            else if (dto.total !== undefined) {
                totalValue = new client_1.Prisma.Decimal(Number(dto.total));
            }
            const updateData = {};
            if (dto.title !== undefined)
                updateData.title = dto.title;
            if (dto.code !== undefined)
                updateData.code = dto.code;
            if (dto.clientName !== undefined)
                updateData.clientName = dto.clientName;
            if (dto.clientCompany !== undefined)
                updateData.clientCompany = dto.clientCompany;
            if (dto.clientEmail !== undefined)
                updateData.clientEmail = dto.clientEmail;
            if (dto.clientPhone !== undefined)
                updateData.clientPhone = dto.clientPhone;
            if (dto.sellerName !== undefined)
                updateData.sellerName = dto.sellerName;
            if (dto.leadId !== undefined) {
                updateData.lead = dto.leadId ? { connect: { id: dto.leadId } } : { disconnect: true };
            }
            if (dto.dealId !== undefined) {
                updateData.deal = dto.dealId ? { connect: { id: dto.dealId } } : { disconnect: true };
            }
            if (dto.validUntil !== undefined) {
                updateData.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
            }
            if (dto.paymentTerms !== undefined)
                updateData.paymentTerms = dto.paymentTerms;
            if (dto.paymentMethod !== undefined)
                updateData.paymentMethod = dto.paymentMethod;
            if (dto.notes !== undefined)
                updateData.notes = dto.notes;
            if (dto.status !== undefined)
                updateData.status = dto.status.toUpperCase();
            if (dto.discountTotal !== undefined)
                updateData.discountTotal = new client_1.Prisma.Decimal(Number(dto.discountTotal));
            updateData.totalValue = totalValue;
            const updated = await tx.proposal.update({
                where: { id: existing.id },
                data: updateData,
                include: {
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            cnpj: true,
                            logoUrl: true,
                            phone: true,
                            address: true,
                            email: true,
                        },
                    },
                    lead: true,
                    deal: true,
                    items: true,
                    contracts: true,
                },
            });
            return this.formatProposal(updated);
        });
    }
    async updateStatus(tenantId, id, dto) {
        const proposal = await this.prisma.proposal.findFirst({
            where: { id, tenantId },
        });
        if (!proposal) {
            throw new common_1.NotFoundException('Proposta não encontrada');
        }
        const updated = await this.prisma.proposal.update({
            where: { id: proposal.id },
            data: {
                status: dto.status.toUpperCase(),
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        cnpj: true,
                        logoUrl: true,
                        phone: true,
                        address: true,
                        email: true,
                    },
                },
                lead: true,
                deal: true,
                items: true,
                contracts: true,
            },
        });
        return this.formatProposal(updated);
    }
    async delete(tenantId, id) {
        const proposal = await this.prisma.proposal.findFirst({
            where: { id, tenantId },
        });
        if (!proposal) {
            throw new common_1.NotFoundException('Proposta não encontrada');
        }
        await this.prisma.proposal.delete({
            where: { id: proposal.id },
        });
        return { success: true, message: 'Proposta comercial excluída com sucesso' };
    }
    async getWhatsAppShare(tenantId, id) {
        const proposal = await this.findOne(tenantId, id);
        const clientName = proposal.clientName || proposal.lead?.name || 'Cliente';
        const clientPhone = proposal.clientPhone || proposal.lead?.phone?.replace(/\D/g, '') || '';
        const total = Number(proposal.totalValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const message = `Olá, *${clientName}*! Tudo bem?\n\nSegue a sua *Proposta Comercial*: *${proposal.title}*\n💰 Valor Total: *${total}*\n📅 Validade: *${proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : 'A combinar'}*\n\nVocê pode revisar e aprovar todos os itens pelo link oficial da nossa plataforma. Qualquer dúvida estamos à disposição!`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = clientPhone ? `https://wa.me/${clientPhone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
        return {
            proposalId: proposal.id,
            title: proposal.title,
            clientName,
            clientPhone,
            totalValue: Number(proposal.totalValue),
            message,
            whatsappUrl,
        };
    }
    async getCompanyProfile(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                cnpj: true,
                logoUrl: true,
                phone: true,
                address: true,
                email: true,
            },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Empresa/Tenant não encontrado');
        return tenant;
    }
    async updateCompanyProfile(tenantId, data) {
        return this.prisma.tenant.update({
            where: { id: tenantId },
            data,
            select: {
                id: true,
                name: true,
                cnpj: true,
                logoUrl: true,
                phone: true,
                address: true,
                email: true,
            },
        });
    }
    async generatePdfHtml(tenantId, id) {
        const proposal = await this.findOne(tenantId, id);
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        const itemsRows = (proposal.items || [])
            .map((item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.name || item.description}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">R$ ${Number(item.unitPrice).toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">R$ ${Number(item.total || item.totalPrice).toFixed(2)}</td>
        </tr>
      `)
            .join('');
        return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Proposta Comercial #${proposal.code || proposal.id.substring(0, 8)}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a202c; margin: 0; padding: 40px; background: #fff; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3182ce; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #2b6cb0; }
          .info-block { margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #edf2f7; padding: 12px; text-align: left; font-size: 13px; color: #4a5568; }
          .total-box { margin-top: 30px; text-align: right; font-size: 20px; font-weight: bold; color: #2d3748; }
          .footer { margin-top: 50px; font-size: 12px; color: #a0aec0; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; gap: 16px;">
            ${tenant?.logoUrl ? `<img src="${tenant.logoUrl}" alt="${tenant.name}" style="max-height: 55px; max-width: 160px; object-fit: contain;" />` : ''}
            <div>
              <div class="title">${tenant?.name || 'VERSUS Commercial'}</div>
              <div style="color: #718096; font-size: 13px;">
                ${tenant?.cnpj ? `<span>CNPJ: ${tenant.cnpj}</span> • ` : ''}
                ${tenant?.email || tenant?.phone ? `<span>${tenant.email || tenant.phone}</span>` : ''}
              </div>
              ${tenant?.address ? `<div style="color: #a0aec0; font-size: 11px;">${tenant.address}</div>` : ''}
            </div>
          </div>
          <div style="text-align: right; font-size: 14px; color: #718096;">
            <div><strong>Código:</strong> ${proposal.code}</div>
            <div><strong>Data:</strong> ${new Date(proposal.createdAt).toLocaleDateString('pt-BR')}</div>
            <div><strong>Validade:</strong> ${proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : 'Não especificada'}</div>
            <div><strong>Status:</strong> <span style="font-weight: bold; color: #2b6cb0;">${proposal.status.toUpperCase()}</span></div>
          </div>
        </div>

        <div class="info-block">
          <h3>Proposta: ${proposal.title}</h3>
          <p><strong>Cliente / Lead:</strong> ${proposal.clientName} ${proposal.clientCompany ? `(${proposal.clientCompany})` : ''} ${proposal.clientEmail ? `• ${proposal.clientEmail}` : ''} ${proposal.clientPhone ? `• ${proposal.clientPhone}` : ''}</p>
          ${proposal.paymentMethod || proposal.paymentTerms ? `<p><strong>Condições de Pagamento:</strong> ${proposal.paymentMethod || proposal.paymentTerms}</p>` : ''}
          ${proposal.notes ? `<p><strong>Observações:</strong> ${proposal.notes}</p>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>Descrição do Item</th>
              <th style="text-align: center;">Qtd</th>
              <th style="text-align: right;">Preço Unitário</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows.length > 0 ? itemsRows : '<tr><td colspan="4" style="padding:15px; text-align:center;">Nenhum item adicionado</td></tr>'}
          </tbody>
        </table>

        <div class="total-box">
          Valor Total: R$ ${Number(proposal.total).toFixed(2)}
        </div>

        <div class="footer">
          Documento gerado automaticamente pela plataforma VERSUS • Todos os direitos reservados.
        </div>
      </body>
      </html>
    `;
    }
};
exports.ProposalsService = ProposalsService;
exports.ProposalsService = ProposalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProposalsService);
//# sourceMappingURL=proposals.service.js.map