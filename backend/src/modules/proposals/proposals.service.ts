import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { CreateProposalProductDto, UpdateProposalProductDto } from './dto/proposal-product.dto';
import { extractGoogleDriveId } from '../../shared/helpers/google-drive.helper';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProposalsService {
  constructor(private readonly prisma: PrismaService) {}

  private formatProposal(p: any) {
    if (!p) return null;

    const totalVal = Number(p.totalValue || 0);
    const discVal = Number(p.discountTotal || 0);
    const subtotal = totalVal + discVal;

    const formattedItems = (p.items || []).map((item: any) => ({
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
      clientCep: p.clientCep || (p.lead as any)?.cep || '',
      clientAddress: p.clientAddress || (p.lead as any)?.address || '',
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

  async findAll(tenantId: string, status?: string) {
    const where: Prisma.ProposalWhereInput = { tenantId };
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

  async findOne(tenantId: string, id: string) {
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
      throw new NotFoundException('Proposta não encontrada');
    }

    return this.formatProposal(proposal);
  }

  async create(tenantId: string, dto: CreateProposalDto) {
    let leadId = dto.leadId || null;

    // Se o leadId não foi fornecido diretamente, busca ou cria o contato no tenant
    if (!leadId && (dto.clientPhone || dto.clientEmail || dto.clientName)) {
      try {
        const phoneClean = dto.clientPhone?.replace(/\D/g, '');
        const existingContact = await this.prisma.contact.findFirst({
          where: {
            tenantId,
            OR: [
              phoneClean ? { phone: { contains: phoneClean } } : undefined,
              dto.clientEmail ? { email: dto.clientEmail } : undefined,
            ].filter(Boolean) as any,
          },
        });

        if (existingContact) {
          leadId = existingContact.id;
        } else if (dto.clientName) {
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
      } catch (err) {
        // Silencioso se houver conflito de índice único
      }
    }

    let calculatedTotal = 0;
    const itemsData = (dto.items || []).map((item) => {
      const q = item.quantity || 1;
      const u = Number(item.unitPrice) || 0;
      const t = item.total ? Number(item.total) : q * u;
      calculatedTotal += t;
      const mediaDriveId = item.imageDriveId || (item.imageUrl ? extractGoogleDriveId(item.imageUrl) : null);
      return {
        name: item.name || item.description || 'Item',
        description: item.description || item.name || 'Item de Proposta',
        imageUrl: item.imageUrl || null,
        imageDriveId: mediaDriveId,
        quantity: q,
        unitPrice: new Prisma.Decimal(u),
        discountPercent: item.discountPercent ? new Prisma.Decimal(item.discountPercent) : new Prisma.Decimal(0),
        totalPrice: new Prisma.Decimal(t),
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
        totalValue: new Prisma.Decimal(finalTotal),
        discountTotal: new Prisma.Decimal(Number(dto.discountTotal || 0)),
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
      }).catch(() => {});
    }

    return this.formatProposal(proposal);
  }

  async update(tenantId: string, id: string, dto: UpdateProposalDto) {
    const existing = await this.prisma.proposal.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });

    if (!existing) {
      throw new NotFoundException('Proposta não encontrada');
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
          const mediaDriveId = item.imageDriveId || (item.imageUrl ? extractGoogleDriveId(item.imageUrl) : null);
          return {
            proposalId: existing.id,
            name: item.name || item.description || 'Item',
            description: item.description || item.name || 'Item de Proposta',
            imageUrl: item.imageUrl || null,
            imageDriveId: mediaDriveId,
            quantity: q,
            unitPrice: new Prisma.Decimal(u),
            discountPercent: item.discountPercent ? new Prisma.Decimal(item.discountPercent) : new Prisma.Decimal(0),
            totalPrice: new Prisma.Decimal(t),
          };
        });

        if (itemsData.length > 0) {
          await tx.proposalItem.createMany({
            data: itemsData,
          });
        }
        totalValue = new Prisma.Decimal(dto.total !== undefined ? Number(dto.total) : calculatedTotal);
      } else if (dto.total !== undefined) {
        totalValue = new Prisma.Decimal(Number(dto.total));
      }

      const updateData: Prisma.ProposalUpdateInput = {};
      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.code !== undefined) updateData.code = dto.code;
      if (dto.clientName !== undefined) updateData.clientName = dto.clientName;
      if (dto.clientCompany !== undefined) updateData.clientCompany = dto.clientCompany;
      if (dto.clientEmail !== undefined) updateData.clientEmail = dto.clientEmail;
      if (dto.clientPhone !== undefined) updateData.clientPhone = dto.clientPhone;
      if (dto.clientCep !== undefined) updateData.clientCep = dto.clientCep;
      if (dto.clientAddress !== undefined) updateData.clientAddress = dto.clientAddress;
      if (dto.sellerName !== undefined) updateData.sellerName = dto.sellerName;
      if (dto.leadId !== undefined) {
        updateData.lead = dto.leadId ? { connect: { id: dto.leadId } } : { disconnect: true };
      }
      if (dto.dealId !== undefined) {
        updateData.deal = dto.dealId ? { connect: { id: dto.dealId } } : { disconnect: true };
      }
      if (dto.validUntil !== undefined) {
        updateData.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
      }
      if (dto.paymentTerms !== undefined) updateData.paymentTerms = dto.paymentTerms;
      if (dto.paymentMethod !== undefined) updateData.paymentMethod = dto.paymentMethod;
      if (dto.notes !== undefined) updateData.notes = dto.notes;
      const logoUrl = dto.logoUrl !== undefined ? dto.logoUrl : (dto.issuer?.logoUrl !== undefined ? dto.issuer.logoUrl : undefined);
      if (logoUrl !== undefined) {
        updateData.logoUrl = logoUrl || null;
        if (logoUrl) {
          await tx.tenant.update({
            where: { id: tenantId },
            data: { logoUrl },
          }).catch(() => {});
        }
      }
      if (dto.status !== undefined) updateData.status = dto.status.toUpperCase();
      if (dto.discountTotal !== undefined) updateData.discountTotal = new Prisma.Decimal(Number(dto.discountTotal));
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

  async updateStatus(tenantId: string, id: string, dto: UpdateProposalStatusDto) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id, tenantId },
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
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

  async delete(tenantId: string, id: string) {
    const proposal = await this.prisma.proposal.findFirst({
      where: { id, tenantId },
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    await this.prisma.proposal.delete({
      where: { id: proposal.id },
    });

    return { success: true, message: 'Proposta comercial excluída com sucesso' };
  }

  async findPublicByCodeOrId(codeOrId: string) {
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
      throw new NotFoundException('Proposta comercial não encontrada ou código inválido.');
    }

    return this.formatProposal(proposal);
  }

  async acceptPublic(codeOrId: string) {
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

  async getWhatsAppShare(tenantId: string, id: string, origin?: string) {
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

  async getCompanyProfile(tenantId: string) {
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
    if (!tenant) throw new NotFoundException('Empresa/Tenant não encontrado');
    return tenant;
  }

  async updateCompanyProfile(
    tenantId: string,
    data: { name?: string; cnpj?: string; logoUrl?: string; phone?: string; address?: string; email?: string },
  ) {
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

  async generatePdfHtml(id: string, tenantId?: string): Promise<string> {
    const where: Prisma.ProposalWhereInput = { id };
    if (tenantId) where.tenantId = tenantId;
    const rawProposal = await this.prisma.proposal.findFirst({
      where,
      include: { lead: true, deal: true, items: true, tenant: true },
    });
    if (!rawProposal) throw new NotFoundException('Proposta não encontrada');
    const proposal = this.formatProposal(rawProposal);
    const tenant = rawProposal.tenant;

    const itemsRows = (proposal.items || [])
      .map(
        (item: any) => {
          const driveId = item.imageDriveId || (item.imageUrl ? extractGoogleDriveId(item.imageUrl) : null);
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
        },
      )
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
            margin: 12mm 15mm;
          }
          * { box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            color: #020617; 
            margin: 0; 
            padding: 20px; 
            background: #ffffff; 
            line-height: 1.45;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            border-bottom: 2.5px solid #0f172a; 
            padding-bottom: 20px; 
            margin-bottom: 20px; 
          }
          .logo-box {
            display: flex;
            align-items: center;
            gap: 18px;
          }
          .company-logo {
            max-height: 85px;
            max-width: 260px;
            min-height: 55px;
            object-fit: contain;
          }
          .company-info {
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .company-name { 
            font-size: 22px; 
            font-weight: 900; 
            color: #020617; 
            letter-spacing: -0.5px;
            line-height: 1.2;
          }
          .company-details {
            color: #0f172a; 
            font-size: 12.5px; 
            font-weight: 700; 
            margin-top: 4px;
            line-height: 1.4;
          }
          .company-address {
            color: #334155; 
            font-size: 11.5px; 
            font-weight: 600; 
            margin-top: 2px;
          }
          .header-right {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          .doc-badge {
            display: inline-block;
            background: #0f172a;
            color: #ffffff;
            font-size: 10.5px;
            font-weight: 900;
            padding: 4px 10px;
            border-radius: 5px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
          }
          .proposal-code {
            font-size: 16px;
            font-weight: 900;
            color: #020617;
            margin-top: 6px;
            font-family: monospace;
          }
          .proposal-dates {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 4px;
            line-height: 1.4;
          }
          .client-box { 
            display: grid;
            grid-template-columns: 1.35fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
          }
          .client-col {
            border-radius: 10px;
            padding: 14px 16px;
          }
          .client-col-primary {
            background: #f0f7ff;
            border: 1.5px solid #93c5fd;
            border-left: 5px solid #1d4ed8;
          }
          .client-col-secondary {
            background: #f0fdf4;
            border: 1.5px solid #86efac;
            border-left: 5px solid #15803d;
          }
          .section-title {
            font-size: 11.5px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 8px;
          }
          .section-title.title-primary { color: #1d4ed8; }
          .section-title.title-secondary { color: #15803d; }
          .client-name {
            font-size: 16px;
            font-weight: 900;
            color: #020617;
          }
          .client-company {
            font-size: 13px;
            font-weight: 800;
            color: #1d4ed8;
            margin-top: 2px;
          }
          .client-contact {
            font-size: 12.5px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 5px;
            line-height: 1.4;
          }
          .client-location {
            font-size: 12px;
            font-weight: 700;
            color: #1e293b;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #93c5fd;
          }
          .seller-name {
            font-size: 15px;
            font-weight: 900;
            color: #020617;
          }
          .terms-box {
            margin-top: 6px;
          }
          .terms-label {
            font-size: 11.5px;
            font-weight: 800;
            color: #166534;
          }
          .terms-value {
            font-size: 13px;
            font-weight: 800;
            color: #020617;
            margin-top: 2px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px; 
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            overflow: hidden;
          }
          th { 
            background: #0f172a; 
            padding: 10px 12px; 
            text-align: left; 
            font-size: 11px; 
            font-weight: 900; 
            color: #ffffff; 
            text-transform: uppercase;
            letter-spacing: 0.6px;
            border: none;
          }
          .totals-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 20px;
            gap: 20px;
          }
          .notes-box {
            flex: 1;
            background: #f8fafc;
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px 14px;
            font-size: 11.5px;
            color: #1e293b;
          }
          .totals-table {
            width: 270px;
            border: 1.5px solid #0f172a;
            border-radius: 8px;
            overflow: hidden;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 9px 12px;
            font-size: 12.5px;
            font-weight: 700;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
          }
          .totals-final {
            display: flex;
            justify-content: space-between;
            padding: 11px 12px;
            font-size: 15px;
            font-weight: 900;
            background: #0f172a;
            color: #ffffff;
          }
          .seal-box { 
            margin-top: 24px; 
            padding: 12px 16px; 
            border: 1.5px solid #cbd5e1; 
            border-radius: 8px; 
            background: #f8fafc;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #334155;
          }
          .footer { 
            margin-top: 20px; 
            font-size: 10px; 
            color: #64748b; 
            text-align: center; 
            border-top: 1px solid #e2e8f0; 
            padding-top: 10px; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-box">
            ${(proposal.logoUrl || tenant?.logoUrl) ? `<img src="${proposal.logoUrl || tenant?.logoUrl}" alt="Logotipo" class="company-logo" />` : ''}
            <div class="company-info">
              <div class="company-name">${tenant?.name || proposal.issuer?.name || 'Vallor Comercial'}</div>
              <div class="company-details">
                ${(proposal.issuer?.document || tenant?.cnpj) ? `<span>CNPJ: ${proposal.issuer?.document || tenant?.cnpj}</span>` : ''}
                ${(proposal.issuer?.phone || tenant?.phone) ? ` • <span>${proposal.issuer?.phone || tenant?.phone}</span>` : ''}
                ${(proposal.issuer?.email || tenant?.email) ? ` • <span>${proposal.issuer?.email || tenant?.email}</span>` : ''}
              </div>
              ${(proposal.issuer?.address || tenant?.address) ? `<div class="company-address">${proposal.issuer?.address || tenant?.address}</div>` : ''}
            </div>
          </div>
          <div class="header-right">
            <div class="doc-badge">Proposta Comercial Oficial</div>
            <div class="proposal-code">${proposal.code}</div>
            <div class="proposal-dates">
              <div><strong>Data de Emissão:</strong> ${new Date(proposal.createdAt).toLocaleDateString('pt-BR')}</div>
              <div><strong>Validade:</strong> ${proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : '15 dias'}</div>
            </div>
          </div>
        </div>

        <div class="client-box">
          <div class="client-col client-col-primary">
            <div class="section-title title-primary">Destinatário / Contratante</div>
            <div class="client-name">${proposal.clientName}</div>
            ${proposal.clientCompany ? `<div class="client-company">${proposal.clientCompany}</div>` : ''}
            <div class="client-contact">
              ${proposal.clientPhone ? `<div><strong>Tel/WhatsApp:</strong> ${proposal.clientPhone}</div>` : ''}
              ${proposal.clientEmail ? `<div><strong>E-mail:</strong> ${proposal.clientEmail}</div>` : ''}
            </div>
            ${(proposal.clientCep || proposal.clientAddress) ? `
            <div class="client-location">
              ${proposal.clientCep ? `<strong>CEP:</strong> ${proposal.clientCep} ` : ''}
              ${proposal.clientAddress ? `• <strong>Endereço:</strong> ${proposal.clientAddress}` : ''}
            </div>` : ''}
          </div>

          <div class="client-col client-col-secondary">
            <div class="section-title title-secondary">Consultor & Condições</div>
            <div class="seller-name">${proposal.sellerName || 'Equipe Comercial'}</div>
            <div class="terms-box">
              <div class="terms-label">Condição de Pagamento:</div>
              <div class="terms-value">${proposal.paymentMethod || 'A combinar'}</div>
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

  // ========================================================
  // CATÁLOGO DE PRODUTOS & INTEGRAÇÃO COM GOOGLE DRIVE
  // ========================================================

  async findAllProducts(tenantId: string, folderName?: string) {
    const where: Prisma.ProposalProductWhereInput = { tenantId, isActive: true };
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

  async createProduct(tenantId: string, dto: CreateProposalProductDto) {
    const driveUrl = dto.driveUrl ? dto.driveUrl.trim() : null;
    const driveId = driveUrl ? extractGoogleDriveId(driveUrl) : (dto.driveId || null);

    const product = await this.prisma.proposalProduct.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : new Prisma.Decimal(0),
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

  async updateProduct(tenantId: string, id: string, dto: UpdateProposalProductDto) {
    const existing = await this.prisma.proposalProduct.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Produto não encontrado.');
    }

    const data: Prisma.ProposalProductUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);
    if (dto.folderName !== undefined) data.folderName = dto.folderName?.trim() || 'Geral';
    if (dto.unit !== undefined) data.unit = dto.unit?.trim() || 'un';
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (dto.driveUrl !== undefined) {
      const driveUrl = dto.driveUrl ? dto.driveUrl.trim() : null;
      data.driveUrl = driveUrl;
      data.driveId = driveUrl ? extractGoogleDriveId(driveUrl) : null;
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

  async deleteProduct(tenantId: string, id: string) {
    const existing = await this.prisma.proposalProduct.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Produto não encontrado.');
    }

    await this.prisma.proposalProduct.delete({
      where: { id },
    });

    return { success: true, message: 'Produto removido do catálogo com sucesso.' };
  }

  async getDriveConfig(tenantId: string) {
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

  async updateDriveConfig(tenantId: string, driveFolder: string) {
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
}

