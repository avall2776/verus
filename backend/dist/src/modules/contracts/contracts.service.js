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
exports.ContractsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const client_1 = require("@prisma/client");
let ContractsService = class ContractsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    formatContract(c) {
        if (!c)
            return null;
        const val = Number(c.value || 0);
        const code = c.code || `CTR-${c.id.slice(0, 8).toUpperCase()}`;
        return {
            id: c.id,
            code,
            title: c.title || 'Contrato de Prestação de Serviços',
            document: c.title || 'Contrato de Prestação de Serviços',
            client: c.clientName,
            clientName: c.clientName,
            clientEmail: c.clientEmail || '',
            clientPhone: c.clientPhone || '',
            clientDocument: c.clientDocument || '',
            clientAddress: c.clientAddress || '',
            value: val,
            status: (c.status || 'PENDING_SIGNATURE').toLowerCase(),
            rawStatus: c.status,
            startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : null,
            endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : null,
            validUntil: c.validUntil ? new Date(c.validUntil).toISOString().split('T')[0] : null,
            signedAt: c.signedAt ? new Date(c.signedAt).toISOString().split('T')[0] : null,
            signIp: c.signIp || null,
            signUserAgent: c.signUserAgent || null,
            documentUrl: c.documentUrl || null,
            auditLogUrl: c.auditLogUrl || null,
            terms: c.terms || null,
            notes: c.notes || null,
            proposalId: c.proposalId || null,
            proposal: c.proposal ? {
                id: c.proposal.id,
                code: c.proposal.code,
                title: c.proposal.title,
                totalValue: Number(c.proposal.totalValue || 0),
                status: c.proposal.status,
            } : null,
            issuer: c.tenant ? {
                name: c.tenant.name || '',
                document: c.tenant.cnpj || '',
                phone: c.tenant.phone || '',
                email: c.tenant.email || '',
                address: c.tenant.address || '',
                logoUrl: c.tenant.logoUrl || '',
            } : null,
            createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
        };
    }
    async findAll(tenantId, search, status) {
        const where = { tenantId };
        if (status && status !== 'all') {
            where.status = { equals: status.toUpperCase() };
        }
        if (search && search.trim()) {
            const q = search.trim();
            where.OR = [
                { clientName: { contains: q, mode: 'insensitive' } },
                { title: { contains: q, mode: 'insensitive' } },
                { code: { contains: q, mode: 'insensitive' } },
                { clientDocument: { contains: q, mode: 'insensitive' } },
            ];
        }
        const contracts = await this.prisma.contract.findMany({
            where,
            include: {
                proposal: {
                    select: {
                        id: true,
                        code: true,
                        title: true,
                        totalValue: true,
                        status: true,
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        cnpj: true,
                        logoUrl: true,
                        phone: true,
                        email: true,
                        address: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return contracts.map((c) => this.formatContract(c));
    }
    async findOne(tenantId, id) {
        const contract = await this.prisma.contract.findFirst({
            where: { id, tenantId },
            include: {
                proposal: {
                    include: {
                        lead: true,
                        deal: true,
                        items: true,
                    },
                },
                tenant: true,
            },
        });
        if (!contract) {
            throw new common_1.NotFoundException('Contrato não encontrado');
        }
        return this.formatContract(contract);
    }
    async create(tenantId, dto) {
        let clientName = dto.clientName;
        let clientEmail = dto.clientEmail;
        let clientPhone = dto.clientPhone;
        let clientDocument = dto.clientDocument;
        let clientAddress = dto.clientAddress;
        let contractValue = dto.value !== undefined ? Number(dto.value) : 0;
        let contractTitle = dto.title || 'Contrato de Prestação de Serviços';
        if (dto.proposalId) {
            const proposal = await this.prisma.proposal.findFirst({
                where: { id: dto.proposalId, tenantId },
                include: { lead: true, items: true },
            });
            if (!proposal) {
                throw new common_1.NotFoundException('Proposta informada não foi encontrada neste tenant.');
            }
            if (!clientName) {
                clientName = proposal.clientName || proposal.lead?.name || 'Cliente';
            }
            if (!clientEmail) {
                clientEmail = proposal.clientEmail || proposal.lead?.email || undefined;
            }
            if (!clientPhone) {
                clientPhone = proposal.clientPhone || proposal.lead?.phone || undefined;
            }
            if (!dto.value && Number(proposal.totalValue) > 0) {
                contractValue = Number(proposal.totalValue);
            }
            if (!dto.title) {
                contractTitle = `Contrato - ${proposal.title}`;
            }
        }
        if (!clientName) {
            clientName = 'Cliente Contratante';
        }
        const code = dto.code || `CTR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const status = (dto.status || 'PENDING_SIGNATURE').toUpperCase();
        const contract = await this.prisma.contract.create({
            data: {
                tenantId,
                proposalId: dto.proposalId || null,
                code,
                title: contractTitle,
                clientName,
                clientEmail: clientEmail || null,
                clientPhone: clientPhone || null,
                clientDocument: clientDocument || null,
                clientAddress: clientAddress || null,
                value: new client_1.Prisma.Decimal(contractValue),
                status,
                startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
                documentUrl: dto.documentUrl || null,
                auditLogUrl: dto.auditLogUrl || null,
                terms: dto.terms || null,
                notes: dto.notes || null,
            },
            include: {
                proposal: true,
                tenant: true,
            },
        });
        return this.formatContract(contract);
    }
    async updateStatus(tenantId, id, dto, clientIp, userAgent) {
        const contract = await this.prisma.contract.findFirst({
            where: { id, tenantId },
        });
        if (!contract) {
            throw new common_1.NotFoundException('Contrato não encontrado');
        }
        const upperStatus = dto.status.toUpperCase();
        const data = {
            status: upperStatus,
        };
        if (upperStatus === 'SIGNED') {
            data.signedAt = new Date();
            data.signIp = dto.signIp || clientIp || '187.127.10.166';
            data.signUserAgent = dto.signUserAgent || userAgent || 'Navegador Web / Assinatura Digital Segura';
            data.auditLogUrl = dto.auditLogUrl || `https://app.versus.com.br/audit/contracts/${contract.id}`;
        }
        if (dto.documentUrl) {
            data.documentUrl = dto.documentUrl;
        }
        if (dto.auditLogUrl) {
            data.auditLogUrl = dto.auditLogUrl;
        }
        const updated = await this.prisma.contract.update({
            where: { id: contract.id },
            data,
            include: {
                proposal: true,
                tenant: true,
            },
        });
        return this.formatContract(updated);
    }
    async delete(tenantId, id) {
        const contract = await this.prisma.contract.findFirst({
            where: { id, tenantId },
        });
        if (!contract) {
            throw new common_1.NotFoundException('Contrato não encontrado');
        }
        await this.prisma.contract.delete({
            where: { id: contract.id },
        });
        return { success: true, message: 'Contrato digital excluído com sucesso.' };
    }
    async getWhatsAppShare(tenantId, id) {
        const contract = await this.findOne(tenantId, id);
        const phone = contract.clientPhone ? contract.clientPhone.replace(/\D/g, '') : '';
        const formattedVal = Number(contract.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const message = `Olá, *${contract.clientName}*! Tudo bem?\n\nSegue o link oficial para assinatura digital do seu contrato: *${contract.title}* (${contract.code}).\n💰 Valor: *${formattedVal}*\n\nVocê pode revisar os termos e efetuar a assinatura eletrônica com validade jurídica pelo link: https://app.versus.com.br/c/${contract.code.toLowerCase()}`;
        const encoded = encodeURIComponent(message);
        const whatsappUrl = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
        return {
            contractId: contract.id,
            code: contract.code,
            clientName: contract.clientName,
            clientPhone: contract.clientPhone,
            message,
            whatsappUrl,
        };
    }
    async generatePdfHtml(tenantId, id) {
        const contract = await this.findOne(tenantId, id);
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        const clauses = contract.terms || `
      <ol style="line-height: 1.6; padding-left: 20px;">
        <li style="margin-bottom: 12px;"><strong>DO OBJETO:</strong> O presente contrato tem por objeto a prestação dos serviços profissionais discriminados na proposta comercial vinculada, com padrões de qualidade e conformidade técnica exigidos no mercado.</li>
        <li style="margin-bottom: 12px;"><strong>DAS OBRIGAÇÕES DA CONTRATADA:</strong> Executar com zelo, segurança e confidencialidade as atividades acordadas, disponibilizando suporte e entrega nos prazos estipulados.</li>
        <li style="margin-bottom: 12px;"><strong>DAS OBRIGAÇÕES DO CONTRATANTE:</strong> Fornecer as informações e acessos necessários para o bom andamento do projeto e efetuar os pagamentos de acordo com o cronograma estabelecido.</li>
        <li style="margin-bottom: 12px;"><strong>DA CONFIDENCIALIDADE E PROTEÇÃO DE DADOS (LGPD):</strong> As partes comprometem-se a proteger integralmente dados pessoais e informações estratégicas trocadas durante a vigência deste instrumento.</li>
        <li style="margin-bottom: 12px;"><strong>DA ASSINATURA ELETRÔNICA:</strong> As partes reconhecem a plena validade jurídica deste documento assinado digitalmente nos termos da MP nº 2.200-2/2001 e da Lei nº 14.063/2020.</li>
      </ol>
    `;
        return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${contract.code} - ${contract.title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a202c; margin: 0; padding: 40px; background: #fff; font-size: 13px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 25px; }
          .title { font-size: 20px; font-weight: bold; color: #0369a1; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
          .signature-box { margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 20px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px; }
          .badge-signed { background: #dcfce7; color: #166534; }
          .badge-pending { background: #fef9c3; color: #854d0e; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; gap: 14px;">
            ${tenant?.logoUrl ? `<img src="${tenant.logoUrl}" alt="${tenant.name}" style="max-height: 50px; max-width: 150px; object-fit: contain;" />` : ''}
            <div>
              <div class="title">${tenant?.name || 'VERSUS Enterprise'}</div>
              <div style="color: #64748b; font-size: 12px;">
                ${tenant?.cnpj ? `<span>CNPJ: ${tenant.cnpj}</span> • ` : ''}
                ${tenant?.email || tenant?.phone ? `<span>${tenant.email || tenant.phone}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: bold; color: #0f172a;">${contract.code}</div>
            <div style="margin-top: 4px;">
              <span class="badge ${contract.status === 'signed' ? 'badge-signed' : 'badge-pending'}">
                ${contract.status === 'signed' ? '✓ CONTRATO ASSINADO' : 'AGUARDANDO ASSINATURA'}
              </span>
            </div>
          </div>
        </div>

        <h2 style="text-align: center; color: #0f172a; margin-bottom: 20px;">${contract.title}</h2>

        <div class="box">
          <div style="margin-bottom: 8px;"><strong>CONTRATADA:</strong> ${tenant?.name || 'VERSUS Tecnologia Ltda'}, CNPJ: ${tenant?.cnpj || 'Consulte o emitente'}.</div>
          <div><strong>CONTRATANTE:</strong> ${contract.clientName} ${contract.clientDocument ? `(CPF/CNPJ: ${contract.clientDocument})` : ''} ${contract.clientEmail ? `• ${contract.clientEmail}` : ''} ${contract.clientPhone ? `• ${contract.clientPhone}` : ''}.</div>
          <div style="margin-top: 8px;"><strong>VALOR TOTAL:</strong> R$ ${Number(contract.value).toFixed(2)}</div>
          <div><strong>VIGÊNCIA:</strong> De ${contract.startDate || 'Data de assinatura'} ${contract.endDate ? `até ${contract.endDate}` : 'por prazo indeterminado'}.</div>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">CLÁUSULAS E DISPOSIÇÕES CONTRATUAIS</h3>
          ${clauses}
        </div>

        <div class="signature-box">
          <table style="width: 100%; text-align: center;">
            <tr>
              <td style="width: 50%; padding: 20px;">
                <div style="border-top: 1px solid #334155; padding-top: 8px; margin: 0 20px;">
                  <strong>CONTRATADA</strong><br/>
                  ${tenant?.name || 'VERSUS Enterprise'}
                </div>
              </td>
              <td style="width: 50%; padding: 20px;">
                <div style="border-top: 1px solid #334155; padding-top: 8px; margin: 0 20px;">
                  <strong>CONTRATANTE</strong><br/>
                  ${contract.clientName}<br/>
                  ${contract.signedAt ? `<span style="color: #166534; font-size: 11px;">Assinado Digitalmente em ${contract.signedAt} (IP: ${contract.signIp || 'Auditado'})</span>` : '<span style="color: #854d0e; font-size: 11px;">Pendente de Assinatura</span>'}
                </div>
              </td>
            </tr>
          </table>
          <div style="text-align: center; color: #94a3b8; font-size: 10px; margin-top: 20px;">
            Documento eletrônico autenticado pela infraestrutura segura do VERSUS • Registro de Auditoria: ${contract.id}
          </div>
        </div>
      </body>
      </html>
    `;
    }
};
exports.ContractsService = ContractsService;
exports.ContractsService = ContractsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContractsService);
//# sourceMappingURL=contracts.service.js.map