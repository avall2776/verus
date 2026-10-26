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
const google_drive_helper_1 = require("../../shared/helpers/google-drive.helper");
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
            imageUrl: item.imageUrl || null,
            imageDriveId: item.imageDriveId || null,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice || 0),
            discountPercent: Number(item.discountPercent || 0),
            total: Number(item.totalPrice || 0),
            totalPrice: Number(item.totalPrice || 0),
        }));
        const rawBaseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://avalmarketing.com.br/vallor';
        const baseUrl = rawBaseUrl.replace(/\/+$/, '');
        const logo = p.logoUrl || p.tenant?.logoUrl || '';
        return {
            ...p,
            id: p.id,
            code: p.code || `PROP-${p.id.slice(0, 8).toUpperCase()}`,
            title: p.title,
            clientName: p.clientName || p.lead?.name || 'Cliente',
            clientCompany: p.clientCompany || undefined,
            clientEmail: p.clientEmail || p.lead?.email || '',
            clientPhone: p.clientPhone || p.lead?.phone || '',
            clientCep: p.clientCep || p.lead?.cep || '',
            clientAddress: p.clientAddress || p.lead?.address || '',
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
            logoUrl: logo,
            publicLink: `${baseUrl}/p/${(p.code || p.id).toLowerCase()}`,
            items: formattedItems,
            issuer: {
                name: p.tenant?.name || 'Vallor Soluções',
                document: p.tenant?.cnpj || '',
                phone: p.tenant?.phone || '',
                email: p.tenant?.email || '',
                address: p.tenant?.address || '',
                logoUrl: logo,
            },
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
            const mediaDriveId = item.imageDriveId || (item.imageUrl ? (0, google_drive_helper_1.extractGoogleDriveId)(item.imageUrl) : null);
            return {
                name: item.name || item.description || 'Item',
                description: item.description || item.name || 'Item de Proposta',
                imageUrl: item.imageUrl || null,
                imageDriveId: mediaDriveId,
                quantity: q,
                unitPrice: new client_1.Prisma.Decimal(u),
                discountPercent: item.discountPercent ? new client_1.Prisma.Decimal(item.discountPercent) : new client_1.Prisma.Decimal(0),
                totalPrice: new client_1.Prisma.Decimal(t),
            };
        });
        const finalTotal = dto.total !== undefined ? Number(dto.total) : calculatedTotal;
        const code = dto.code || `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const logoUrl = dto.logoUrl || dto.issuer?.logoUrl || null;
        const proposal = await this.prisma.proposal.create({
            data: {
                tenantId,
                code,
                title: dto.title || 'Proposta Comercial',
                clientName: dto.clientName || null,
                clientCompany: dto.clientCompany || null,
                clientEmail: dto.clientEmail || null,
                clientPhone: dto.clientPhone || null,
                clientCep: dto.clientCep || null,
                clientAddress: dto.clientAddress || null,
                sellerName: dto.sellerName || 'Equipe Comercial',
                leadId,
                dealId: dto.dealId || null,
                validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
                paymentTerms: dto.paymentTerms || null,
                paymentMethod: dto.paymentMethod || null,
                notes: dto.notes || null,
                logoUrl,
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
        if (logoUrl) {
            await this.prisma.tenant.update({
                where: { id: tenantId },
                data: { logoUrl },
            }).catch(() => { });
        }
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
                    const mediaDriveId = item.imageDriveId || (item.imageUrl ? (0, google_drive_helper_1.extractGoogleDriveId)(item.imageUrl) : null);
                    return {
                        proposalId: existing.id,
                        name: item.name || item.description || 'Item',
                        description: item.description || item.name || 'Item de Proposta',
                        imageUrl: item.imageUrl || null,
                        imageDriveId: mediaDriveId,
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
            if (dto.clientCep !== undefined)
                updateData.clientCep = dto.clientCep;
            if (dto.clientAddress !== undefined)
                updateData.clientAddress = dto.clientAddress;
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
            const logoUrl = dto.logoUrl !== undefined ? dto.logoUrl : (dto.issuer?.logoUrl !== undefined ? dto.issuer.logoUrl : undefined);
            if (logoUrl !== undefined) {
                updateData.logoUrl = logoUrl || null;
                if (logoUrl) {
                    await tx.tenant.update({
                        where: { id: tenantId },
                        data: { logoUrl },
                    }).catch(() => { });
                }
            }
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
    async findPublicByCodeOrId(codeOrId) {
        const clean = codeOrId.trim();
        const proposal = await this.prisma.proposal.findFirst({
            where: {
                OR: [
                    { code: { equals: clean, mode: 'insensitive' } },
                    { id: clean },
                ],
            },
            include: {
                lead: true,
                deal: true,
                items: true,
                tenant: true,
            },
        });
        if (!proposal) {
            throw new common_1.NotFoundException('Proposta comercial não encontrada ou código inválido.');
        }
        return this.formatProposal(proposal);
    }
    async acceptPublic(codeOrId) {
        const proposal = await this.findPublicByCodeOrId(codeOrId);
        const updated = await this.prisma.proposal.update({
            where: { id: proposal.id },
            data: {
                status: 'ACCEPTED',
                acceptedAt: new Date(),
            },
            include: {
                lead: true,
                deal: true,
                items: true,
                tenant: true,
            },
        });
        return this.formatProposal(updated);
    }
    async getWhatsAppShare(tenantId, id, origin) {
        const proposal = await this.findOne(tenantId, id);
        const clientName = proposal.clientName || proposal.lead?.name || 'Cliente';
        let clientPhone = proposal.clientPhone || proposal.lead?.phone?.replace(/\D/g, '') || '';
        if (clientPhone && (clientPhone.length === 10 || clientPhone.length === 11) && !clientPhone.startsWith('55')) {
            clientPhone = `55${clientPhone}`;
        }
        const total = Number(proposal.totalValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const rawBaseUrl = origin || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://avalmarketing.com.br/vallor';
        const baseUrl = rawBaseUrl.replace(/\/+$/, '');
        const proposalLink = `${baseUrl}/p/${(proposal.code || proposal.id).toLowerCase()}`;
        const message = `Olá, *${clientName}*! Tudo bem?\n\nSegue a sua *Proposta Comercial*: *${proposal.title}* (${proposal.code})\n💰 Valor Total: *${total}*\n📅 Validade: *${proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : 'A combinar'}*\n\nVocê pode revisar e aprovar todos os itens pelo link seguro: ${proposalLink}`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = clientPhone ? `https://wa.me/${clientPhone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
        return {
            proposalId: proposal.id,
            code: proposal.code,
            title: proposal.title,
            clientName,
            clientPhone,
            proposalLink,
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
    async generatePdfHtml(id, tenantId) {
        const where = { id };
        if (tenantId)
            where.tenantId = tenantId;
        const rawProposal = await this.prisma.proposal.findFirst({
            where,
            include: { lead: true, deal: true, items: true, tenant: true },
        });
        if (!rawProposal)
            throw new common_1.NotFoundException('Proposta não encontrada');
        const proposal = this.formatProposal(rawProposal);
        const tenant = rawProposal.tenant;
        const itemsRows = (proposal.items || [])
            .map((item) => {
            const driveId = item.imageDriveId || (item.imageUrl ? (0, google_drive_helper_1.extractGoogleDriveId)(item.imageUrl) : null);
            const thumbUrl = driveId
                ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`
                : item.imageUrl;
            const imgTag = thumbUrl
                ? `<img src="${thumbUrl}" alt="${item.name || ''}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; margin-right: 12px; vertical-align: middle;" />`
                : '';
            const disc = Number(item.discountPercent || 0);
            return `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">
              <div style="display: flex; align-items: center;">
                ${imgTag}
                <div>
                  <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${item.name || item.description}</div>
                  ${item.description && item.description !== item.name ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.description}</div>` : ''}
                </div>
              </div>
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #334155; font-size: 13px;">${item.quantity}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155; font-size: 13px; font-family: monospace;">R$ ${Number(item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b; font-size: 12px;">${disc > 0 ? `${disc}%` : '-'}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a; font-size: 13px; font-family: monospace;">R$ ${Number(item.total || item.totalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          </tr>
          `;
        })
            .join('');
        const rawBaseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://avalmarketing.com.br/vallor';
        const baseUrl = rawBaseUrl.replace(/\/+$/, '');
        const publicUrl = `${baseUrl}/p/${(proposal.code || proposal.id).toLowerCase()}`;
        return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Proposta Comercial #${proposal.code || proposal.id.substring(0, 8)}</title>
        <style>
          @page {
            size: A4;
            margin: 14mm 16mm;
          }
          * { box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            color: #0f172a; 
            margin: 0; 
            padding: 24px; 
            background: #ffffff; 
            line-height: 1.45;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            border-bottom: 2px solid #0f172a; 
            padding-bottom: 18px; 
            margin-bottom: 22px; 
          }
          .company-name { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
          .doc-badge {
            display: inline-block;
            background: #0f172a;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .client-box { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0; 
            border-radius: 10px; 
            padding: 14px 18px; 
            margin-bottom: 22px;
            display: grid;
            grid-template-columns: 1.4fr 1fr;
            gap: 16px;
          }
          .section-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #475569;
            margin-bottom: 8px;
          }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { 
            background: #f1f5f9; 
            padding: 10px 12px; 
            text-align: left; 
            font-size: 11px; 
            font-weight: 800; 
            color: #334155; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1;
          }
          .totals-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 22px;
            gap: 20px;
          }
          .notes-box {
            flex: 1;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 14px;
            font-size: 11px;
            color: #334155;
          }
          .totals-table {
            width: 260px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            overflow: hidden;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            font-size: 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .totals-final {
            display: flex;
            justify-content: space-between;
            padding: 10px 12px;
            font-size: 14px;
            font-weight: 800;
            background: #0f172a;
            color: #ffffff;
          }
          .seal-box { 
            margin-top: 26px; 
            padding: 12px 16px; 
            border: 1px solid #cbd5e1; 
            border-radius: 8px; 
            background: #fafafa;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
          }
          .footer { 
            margin-top: 24px; 
            font-size: 10px; 
            color: #64748b; 
            text-align: center; 
            border-top: 1px solid #e2e8f0; 
            padding-top: 12px; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; gap: 16px;">
            ${(proposal.logoUrl || tenant?.logoUrl) ? `<img src="${proposal.logoUrl || tenant?.logoUrl}" alt="Logotipo" style="max-height: 55px; max-width: 170px; object-fit: contain;" />` : ''}
            <div>
              <div class="company-name">${tenant?.name || proposal.issuer?.name || 'Vallor Comercial'}</div>
              <div style="color: #475569; font-size: 12px; margin-top: 3px;">
                ${(proposal.issuer?.document || tenant?.cnpj) ? `<span>CNPJ: ${proposal.issuer?.document || tenant?.cnpj}</span>` : ''}
                ${(proposal.issuer?.phone || tenant?.phone) ? ` • <span>${proposal.issuer?.phone || tenant?.phone}</span>` : ''}
                ${(proposal.issuer?.email || tenant?.email) ? ` • <span>${proposal.issuer?.email || tenant?.email}</span>` : ''}
              </div>
              ${(proposal.issuer?.address || tenant?.address) ? `<div style="color: #64748b; font-size: 11px; margin-top: 2px;">${proposal.issuer?.address || tenant?.address}</div>` : ''}
            </div>
          </div>
          <div style="text-align: right;">
            <div class="doc-badge">Proposta Comercial Oficial</div>
            <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 6px; font-family: monospace;">${proposal.code}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;"><strong>Data de Emissão:</strong> ${new Date(proposal.createdAt).toLocaleDateString('pt-BR')}</div>
            <div style="font-size: 11px; color: #475569;"><strong>Validade:</strong> ${proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : '15 dias'}</div>
          </div>
        </div>

        <div class="client-box">
          <div>
            <div class="section-title">Destinatário / Contratante</div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${proposal.clientName}</div>
            ${proposal.clientCompany ? `<div style="font-size: 12px; font-weight: 600; color: #2563eb; margin-top: 2px;">${proposal.clientCompany}</div>` : ''}
            <div style="font-size: 12px; color: #475569; margin-top: 4px;">
              ${proposal.clientPhone ? `<span>Tel/WhatsApp: ${proposal.clientPhone}</span>` : ''}
              ${proposal.clientEmail ? ` • <span>${proposal.clientEmail}</span>` : ''}
            </div>
            ${(proposal.clientCep || proposal.clientAddress) ? `
            <div style="font-size: 11px; color: #334155; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #cbd5e1;">
              ${proposal.clientCep ? `<strong>CEP:</strong> ${proposal.clientCep} ` : ''}
              ${proposal.clientAddress ? `• <strong>Endereço:</strong> ${proposal.clientAddress}` : ''}
            </div>` : ''}
          </div>

          <div style="border-left: 1px solid #e2e8f0; padding-left: 16px;">
            <div class="section-title">Consultor & Condições</div>
            <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${proposal.sellerName || 'Equipe Comercial'}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 6px;">
              <strong>Condição de Pagamento:</strong><br/>
              <span style="color: #0f172a; font-weight: 600;">${proposal.paymentMethod || 'A combinar'}</span>
            </div>
          </div>
        </div>

        <div class="section-title" style="margin-top: 14px;">Detalhamento de Itens & Escopo Fornecido</div>
        <table>
          <thead>
            <tr>
              <th>Descrição do Serviço / Produto</th>
              <th style="text-align: center; width: 60px;">Qtd</th>
              <th style="text-align: right; width: 110px;">Valor Unit.</th>
              <th style="text-align: right; width: 70px;">Desc.</th>
              <th style="text-align: right; width: 120px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows.length > 0 ? itemsRows : '<tr><td colspan="5" style="padding:16px; text-align:center; color:#64748b;">Nenhum item adicionado</td></tr>'}
          </tbody>
        </table>

        <div class="totals-container">
          <div class="notes-box">
            <div style="font-weight: 700; text-transform: uppercase; margin-bottom: 4px; color: #0f172a; font-size: 10px;">Termos Comerciais & Garantia</div>
            <div>${proposal.notes || 'Proposta comercial válida sob condições gerais acordadas entre as partes. Garantia e prazos de entrega conforme especificações técnicas do fabricante.'}</div>
          </div>

          <div class="totals-table">
            <div class="totals-row">
              <span style="color: #64748b;">Subtotal Bruto:</span>
              <span style="font-weight: 600; font-family: monospace;">R$ ${Number(proposal.subtotal || proposal.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            ${Number(proposal.discountTotal || 0) > 0 ? `
            <div class="totals-row" style="color: #16a34a;">
              <span>Desconto Global:</span>
              <span style="font-weight: 600; font-family: monospace;">- R$ ${Number(proposal.discountTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>` : ''}
            <div class="totals-final">
              <span>VALOR TOTAL:</span>
              <span style="font-family: monospace;">R$ ${Number(proposal.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div class="seal-box">
          <div>
            <strong style="color: #0f172a;">Assinatura Eletrônica & Aceite Digital</strong><br/>
            <span style="color: #64748b;">Documento emitido com autenticação digital e conformidade MP 2.200-2/2001.</span>
          </div>
          <div style="text-align: right;">
            <span style="color: #64748b;">Link de Validação do Cliente:</span><br/>
            <a href="${publicUrl}" style="color: #2563eb; text-decoration: none; font-weight: 600; font-size: 11px;">${publicUrl}</a>
          </div>
        </div>

        <div class="footer">
          Documento gerado automaticamente pelo Sistema Vallor • Todos os direitos reservados.
        </div>
      </body>
      </html>
    `;
    }
    async findAllProducts(tenantId, folderName) {
        const where = { tenantId, isActive: true };
        if (folderName && folderName !== 'ALL') {
            where.folderName = folderName;
        }
        const products = await this.prisma.proposalProduct.findMany({
            where,
            orderBy: [{ folderName: 'asc' }, { name: 'asc' }],
        });
        return products.map((p) => ({
            ...p,
            price: Number(p.price || 0),
        }));
    }
    async createProduct(tenantId, dto) {
        const driveUrl = dto.driveUrl ? dto.driveUrl.trim() : null;
        const driveId = driveUrl ? (0, google_drive_helper_1.extractGoogleDriveId)(driveUrl) : (dto.driveId || null);
        const product = await this.prisma.proposalProduct.create({
            data: {
                tenantId,
                name: dto.name.trim(),
                description: dto.description?.trim() || null,
                price: dto.price !== undefined ? new client_1.Prisma.Decimal(dto.price) : new client_1.Prisma.Decimal(0),
                driveUrl,
                driveId,
                folderName: dto.folderName?.trim() || 'Geral',
                unit: dto.unit?.trim() || 'un',
                isActive: dto.isActive !== undefined ? dto.isActive : true,
            },
        });
        return {
            ...product,
            price: Number(product.price || 0),
        };
    }
    async updateProduct(tenantId, id, dto) {
        const existing = await this.prisma.proposalProduct.findFirst({
            where: { id, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Produto não encontrado.');
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name.trim();
        if (dto.description !== undefined)
            data.description = dto.description?.trim() || null;
        if (dto.price !== undefined)
            data.price = new client_1.Prisma.Decimal(dto.price);
        if (dto.folderName !== undefined)
            data.folderName = dto.folderName?.trim() || 'Geral';
        if (dto.unit !== undefined)
            data.unit = dto.unit?.trim() || 'un';
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        if (dto.driveUrl !== undefined) {
            const driveUrl = dto.driveUrl ? dto.driveUrl.trim() : null;
            data.driveUrl = driveUrl;
            data.driveId = driveUrl ? (0, google_drive_helper_1.extractGoogleDriveId)(driveUrl) : null;
        }
        const updated = await this.prisma.proposalProduct.update({
            where: { id },
            data,
        });
        return {
            ...updated,
            price: Number(updated.price || 0),
        };
    }
    async deleteProduct(tenantId, id) {
        const existing = await this.prisma.proposalProduct.findFirst({
            where: { id, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Produto não encontrado.');
        }
        await this.prisma.proposalProduct.delete({
            where: { id },
        });
        return { success: true, message: 'Produto removido do catálogo com sucesso.' };
    }
    async getDriveConfig(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                proposalDriveFolder: true,
            },
        });
        return {
            driveFolder: tenant?.proposalDriveFolder || process.env.GOOGLE_DRIVE_ROOT_FOLDER || '',
        };
    }
    async updateDriveConfig(tenantId, driveFolder) {
        const cleanFolder = driveFolder ? driveFolder.trim() : null;
        const updated = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                proposalDriveFolder: cleanFolder,
            },
            select: {
                proposalDriveFolder: true,
            },
        });
        return {
            driveFolder: updated.proposalDriveFolder || '',
        };
    }
};
exports.ProposalsService = ProposalsService;
exports.ProposalsService = ProposalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProposalsService);
//# sourceMappingURL=proposals.service.js.map