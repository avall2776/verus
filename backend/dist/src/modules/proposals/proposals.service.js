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
    async findAll(tenantId, status) {
        const where = { tenantId };
        if (status) {
            where.status = status;
        }
        return this.prisma.proposal.findMany({
            where,
            include: {
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
    }
    async findOne(tenantId, id) {
        const proposal = await this.prisma.proposal.findFirst({
            where: { id, tenantId },
            include: {
                lead: true,
                deal: true,
                items: true,
                contracts: true,
            },
        });
        if (!proposal) {
            throw new common_1.NotFoundException('Proposta não encontrada');
        }
        return proposal;
    }
    async create(tenantId, dto) {
        let calculatedTotal = 0;
        const itemsData = (dto.items || []).map((item) => {
            const q = item.quantity || 1;
            const u = Number(item.unitPrice) || 0;
            const t = q * u;
            calculatedTotal += t;
            return {
                description: item.description,
                quantity: q,
                unitPrice: new client_1.Prisma.Decimal(u),
                totalPrice: new client_1.Prisma.Decimal(t),
            };
        });
        return this.prisma.proposal.create({
            data: {
                tenantId,
                title: dto.title,
                leadId: dto.leadId || null,
                dealId: dto.dealId || null,
                validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
                paymentTerms: dto.paymentTerms || null,
                notes: dto.notes || null,
                totalValue: new client_1.Prisma.Decimal(calculatedTotal),
                status: 'DRAFT',
                items: {
                    create: itemsData,
                },
            },
            include: {
                lead: true,
                deal: true,
                items: true,
            },
        });
    }
    async updateStatus(tenantId, id, dto) {
        const proposal = await this.findOne(tenantId, id);
        return this.prisma.proposal.update({
            where: { id: proposal.id },
            data: {
                status: dto.status,
            },
            include: {
                lead: true,
                deal: true,
                items: true,
                contracts: true,
            },
        });
    }
    async generatePdfHtml(tenantId, id) {
        const proposal = await this.findOne(tenantId, id);
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        const itemsRows = proposal.items
            .map((item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.description}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">R$ ${Number(item.unitPrice).toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">R$ ${Number(item.totalPrice).toFixed(2)}</td>
        </tr>
      `)
            .join('');
        return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Proposta Comercial #${proposal.id.substring(0, 8)}</title>
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
          <div>
            <div class="title">${tenant?.name || 'VERSUS Commercial'}</div>
            <div style="color: #718096; font-size: 14px;">Proposta Comercial Oficial</div>
          </div>
          <div style="text-align: right; font-size: 14px; color: #718096;">
            <div><strong>Data:</strong> ${new Date(proposal.createdAt).toLocaleDateString('pt-BR')}</div>
            <div><strong>Validade:</strong> ${proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : 'Não especificada'}</div>
            <div><strong>Status:</strong> ${proposal.status}</div>
          </div>
        </div>

        <div class="info-block">
          <h3>Proposta: ${proposal.title}</h3>
          ${proposal.lead ? `<p><strong>Cliente / Lead:</strong> ${proposal.lead.name} (${proposal.lead.email || proposal.lead.phone || 'Sem contato'})</p>` : ''}
          ${proposal.paymentTerms ? `<p><strong>Condições de Pagamento:</strong> ${proposal.paymentTerms}</p>` : ''}
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
          Valor Total: R$ ${Number(proposal.totalValue).toFixed(2)}
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