import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total Leads Hoje
    const totalLeadsToday = await this.prisma.contact.count({
      where: {
        tenantId,
        createdAt: { gte: today }
      }
    });

    // Total Contatos
    const totalContacts = await this.prisma.contact.count({
      where: { tenantId }
    });

    // Total Deals (Qualificados pela IA)
    const totalDeals = await this.prisma.deal.count({
      where: { tenantId }
    });

    const qualRate = totalContacts > 0 ? Math.round((totalDeals / totalContacts) * 100) : 0;

    // Aguardando Humano (Handoff)
    const waitingHuman = await this.prisma.conversation.count({
      where: {
        tenantId,
        status: 'human_takeover'
      }
    });

    // Receita em Pipeline (Soma de Deals)
    const pipelineRevenueResult = await this.prisma.deal.aggregate({
      where: { tenantId },
      _sum: { value: true }
    });
    
    // Convertendo Decimal para número ou formatando
    const pipelineRevenue = pipelineRevenueResult._sum.value ? pipelineRevenueResult._sum.value.toNumber() : 0;
    
    // Recentes (5 últimos contatos)
    const recentLeadsRaw = await this.prisma.contact.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { deals: true }
    });
    
    const recentLeads = recentLeadsRaw.map((c, idx) => {
      // Calcular "temp" com base em se tem Deal
      let temp = c.deals.length > 0 ? 'Quente' : 'Frio';
      let value = c.deals.reduce((acc, d) => acc + (d.value ? d.value.toNumber() : 0), 0);
      
      return {
        id: c.id,
        name: c.name,
        source: c.source,
        temp,
        time: c.createdAt.toISOString(),
        value: value > 0 ? `R$ ${value}` : '-'
      };
    });

    // Gráfico de Barras Mockado (pode ser substituído por dados reais em breve)
    // Para simplificar agora, retornamos um array simples
    const chartData = [40, 65, 45, 80, 55, 90, 75];

    return {
      kpis: {
        totalLeadsToday,
        qualRate,
        waitingHuman,
        pipelineRevenue
      },
      recentLeads,
      chartData
    };
  }
}
