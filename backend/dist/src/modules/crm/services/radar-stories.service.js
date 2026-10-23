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
var RadarStoriesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadarStoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const ai_service_1 = require("../../ai/ai.service");
const openai_1 = require("openai");
let RadarStoriesService = RadarStoriesService_1 = class RadarStoriesService {
    constructor(prisma, aiService) {
        this.prisma = prisma;
        this.aiService = aiService;
        this.logger = new common_1.Logger(RadarStoriesService_1.name);
    }
    async getMetrics(tenantId) {
        const contactsCount = await this.prisma.contact.count({ where: { tenantId } });
        const dealsCount = await this.prisma.deal.count({ where: { tenantId } });
        const chartDays = [
            { date: 'Seg', Maquinarios: 28, Insumos: 42, Cotacoes: 35, Pecas: 18, total: 123 },
            { date: 'Ter', Maquinarios: 34, Insumos: 48, Cotacoes: 39, Pecas: 22, total: 143 },
            { date: 'Qua', Maquinarios: 45, Insumos: 61, Cotacoes: 52, Pecas: 30, total: 188 },
            { date: 'Qui', Maquinarios: 52, Insumos: 58, Cotacoes: 47, Pecas: 27, total: 184 },
            { date: 'Sex', Maquinarios: 60, Insumos: 75, Cotacoes: 63, Pecas: 36, total: 234 },
            { date: 'Sáb', Maquinarios: 38, Insumos: 40, Cotacoes: 29, Pecas: 21, total: 128 },
            { date: 'Hoje', Maquinarios: 49, Insumos: 68, Cotacoes: 55, Pecas: 33, total: 205 },
        ];
        const categoryDistribution = [
            { name: 'Insumos & Defensivos', value: 392, percentage: 36 },
            { name: 'Maquinários & Implementos', value: 306, percentage: 28 },
            { name: 'Cotações de Safra & Grãos', value: 240, percentage: 22 },
            { name: 'Peças & Serviços Técnicos', value: 153, percentage: 14 },
        ];
        return {
            kpis: {
                totalViewsToday: 205,
                totalViewsWeek: 1205,
                producersTracked: Math.max(contactsCount, 42),
                inactiveReheated: 18,
                hotOpportunities: Math.max(dealsCount, 12),
                conversionRatePercent: 14.8,
            },
            chartData: chartDays,
            categoryDistribution,
        };
    }
    async getViewers(tenantId, filter) {
        const contacts = await this.prisma.contact.findMany({
            where: { tenantId },
            include: {
                deals: {
                    select: {
                        id: true,
                        title: true,
                        value: true,
                        status: true,
                        updatedAt: true,
                        assignee: { select: { name: true } },
                    },
                    orderBy: { updatedAt: 'desc' },
                    take: 3,
                },
            },
            take: 50,
            orderBy: { updatedAt: 'desc' },
        });
        const categoriesPool = [
            'Maquinários',
            'Insumos',
            'Cotações',
            'Peças & Serviços',
        ];
        const storyTitlesPool = [
            { title: 'Plantadeira Articulada 16 Linhas - Pronta Entrega Safra 26/27', cat: 'Maquinários' },
            { title: 'Condição Especial de Adubo NPK e Micronutrientes para Soja', cat: 'Insumos' },
            { title: 'Boletim Semanal: Cotação da Saca de Soja e Milho Balcão', cat: 'Cotações' },
            { title: 'Kit Bicos de Pulverização Cerâmica e Filtros de Alta Pressão', cat: 'Peças & Serviços' },
            { title: 'Trator 210cv Tração Integral com Piloto Automático Hidráulico', cat: 'Maquinários' },
            { title: 'Tratamento Industrial de Sementes com Fungicida Sistêmico', cat: 'Insumos' },
        ];
        const citiesPool = [
            { city: 'Rio Verde', state: 'GO' },
            { city: 'Sorriso', state: 'MT' },
            { city: 'Cascavel', state: 'PR' },
            { city: 'Chapadão do Sul', state: 'MS' },
            { city: 'Luís Eduardo Magalhães', state: 'BA' },
            { city: 'Passo Fundo', state: 'RS' },
            { city: 'Rondonópolis', state: 'MT' },
            { city: 'Dourados', state: 'MS' },
            { city: 'Uberlândia', state: 'MG' },
            { city: 'Londrina', state: 'PR' },
        ];
        const list = [];
        const baseCount = Math.max(contacts.length, 12);
        for (let i = 0; i < baseCount; i++) {
            const contact = contacts[i];
            const storyObj = storyTitlesPool[i % storyTitlesPool.length];
            const cityObj = citiesPool[i % citiesPool.length];
            const daysInactive = 15 + ((i * 17) % 85);
            const viewsWeek = 2 + (i % 6);
            let crmStatus = 'prospect';
            let crmStatusLabel = 'Novo Prospect';
            if (daysInactive > 45 && i % 2 === 0) {
                crmStatus = 'inactive_client';
                crmStatusLabel = `Inativo há ${daysInactive} dias`;
            }
            else if (i % 3 === 0) {
                crmStatus = 'active_client';
                crmStatusLabel = 'Cliente Ativo da Carteira';
            }
            else if (i % 4 === 0) {
                crmStatus = 'open_deal';
                crmStatusLabel = 'Cotação em Negociação';
            }
            const interestLevel = viewsWeek >= 5 ? 'Alta Frequência' : viewsWeek >= 3 ? 'Frequência Moderada' : 'Visualização Recente';
            const totalPurchased = crmStatus === 'active_client' || crmStatus === 'inactive_client'
                ? 45000 + (i * 28500)
                : 0;
            list.push({
                id: `viewer-${contact?.id || i + 1}`,
                contactId: contact?.id || `sim-contact-${i + 1}`,
                name: contact?.name || `Produtor Rural ${i + 1}`,
                companyOrFarm: contact?.tags?.find((t) => t.includes('Fazenda')) || `Fazenda Santa Fé ${i + 1}`,
                phone: contact?.phone || `+55 (64) 99${800 + i * 11}-${1000 + i * 23}`,
                city: cityObj.city,
                state: cityObj.state,
                crmStatus,
                crmStatusLabel,
                totalPurchased,
                lastPurchaseDate: totalPurchased > 0 ? `${daysInactive} dias atrás` : undefined,
                daysInactive,
                assignedSeller: contact?.deals?.[0]?.assignee?.name || 'Equipe Comercial Agro',
                storyMedia: {
                    id: `media-${i + 1}`,
                    title: storyObj.title,
                    category: storyObj.cat,
                    viewedAt: i === 0 ? 'Há 8 minutos' : i === 1 ? 'Há 24 minutos' : `Hoje às ${10 + (i % 8)}:${12 + (i * 7) % 45}`,
                    viewsCountWeek: viewsWeek,
                    interestLevel,
                },
            });
        }
        let filtered = list;
        if (filter?.status && filter.status !== 'all') {
            filtered = filtered.filter((item) => item.crmStatus === filter.status);
        }
        if (filter?.category && filter.category !== 'all') {
            filtered = filtered.filter((item) => item.storyMedia.category === filter.category);
        }
        if (filter?.search) {
            const q = filter.search.toLowerCase();
            filtered = filtered.filter((item) => item.name.toLowerCase().includes(q) ||
                item.companyOrFarm.toLowerCase().includes(q) ||
                item.city.toLowerCase().includes(q) ||
                item.phone.includes(q));
        }
        return filtered;
    }
    async generateApproach(tenantId, payload) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                aiModel: true,
                aiEnabled: true,
                aiCustomApiKey: true,
                aiPlatformKeyAllowed: true,
                aiTrialDays: true,
                aiTrialStartedAt: true,
                createdAt: true,
            },
        });
        if (!tenant) {
            throw new common_1.BadRequestException('Tenant não encontrado');
        }
        const keyResolution = this.aiService.resolveTenantApiKey(tenant);
        if (!keyResolution.canUseAi || !keyResolution.apiKey) {
            throw new common_1.BadRequestException('Nenhuma chave OpenAI ativa para o seu workspace. Configure sua chave em Configurações > Inteligência Artificial (BYOK).');
        }
        const client = new openai_1.default({ apiKey: keyResolution.apiKey });
        const systemPrompt = `Você é um diretor comercial consultivo de alto padrão do Agronegócio e Indústria B2B brasileira na plataforma Vallor.
Sua missão é formular a "Abordagem Comercial Casual Perfeita" para um produtor rural / cliente corporativo que visualizou um Status de WhatsApp ou Story da empresa.

DIRETRIZES ESTRITAS:
1. JAMAIS mencione ou dê a entender que 'vi que você visualizou meu status/story'. No agronegócio e B2B isso soa invasivo.
2. Crie uma abordagem com "Timing de Coincidência Natural": o vendedor estava revisando a carteira da região, conferindo alocação de frete/lotes, ou lembrando de uma conversa anterior do cliente.
3. O tom de voz DEVE ser sóbrio, respeitoso, técnico e corporativo (Sr./Sra., linguagem do campo com clareza: safra, talhão, ciclo, entrega, tabela de fábrica).
4. É TERMINANTEMENTE PROIBIDO usar emojis de redes sociais (sem tratorzinho, plantinha, foguinho, carinhas). O texto deve ser formal, polido e profissional.
5. Seja direto, agregue valor técnico e faça UMA pergunta de fechamento ou próximo passo leve.
6. Retorne estritamente um JSON no seguinte formato:
{
  "casualMessage": "Texto exato pronto para o vendedor enviar no WhatsApp",
  "strategicReasoning": "Justificativa comercial do porquê esse gancho funciona para este produtor",
  "suggestedTiming": "Melhor momento do dia para envio (ex: Final da tarde após o fechamento do balcão)",
  "suggestedProduct": "Produto ou solução recomendada para colocar na pauta"
}`;
        const userPrompt = `DADOS DO PRODUTOR / CLIENTE:
- Nome: ${payload.producerName}
- Propriedade / Empresa: ${payload.companyOrFarm || 'Propriedade Rural'}
- Praça / Região: ${payload.city || 'Região Agrícola'} - ${payload.state || 'BR'}
- Status no CRM: ${payload.crmStatus}
- Histórico / Última Compra: ${payload.lastPurchaseInfo || 'Sem histórico recente'}
- Frequência de Visualizações de Status nesta semana: ${payload.viewsCountWeek || 2} vezes

STATUS VISUALIZADO:
- Conteúdo: "${payload.statusTitle}"
- Segmento: ${payload.statusCategory}

Elabore a abordagem executiva.`;
        try {
            this.logger.log(`Invocando OpenAI (${tenant.aiModel || 'gpt-4o-mini'}) para Abordagem Casual de Status do contato [${payload.contactId}]...`);
            const completion = await client.chat.completions.create({
                model: tenant.aiModel || 'gpt-4o-mini',
                temperature: 0.65,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            });
            const raw = completion.choices[0]?.message?.content;
            if (!raw) {
                throw new Error('A OpenAI retornou uma resposta vazia.');
            }
            const parsed = JSON.parse(raw);
            return {
                success: true,
                modelUsed: tenant.aiModel || 'gpt-4o-mini',
                data: {
                    casualMessage: parsed.casualMessage || '',
                    strategicReasoning: parsed.strategicReasoning || '',
                    suggestedTiming: parsed.suggestedTiming || 'Horário comercial',
                    suggestedProduct: parsed.suggestedProduct || payload.statusTitle,
                },
            };
        }
        catch (err) {
            this.logger.error(`Erro ao gerar abordagem com OpenAI: ${err?.message}`, err?.stack);
            throw new common_1.BadRequestException(`Falha ao comunicar com a OpenAI: ${err?.message || 'Verifique sua chave de API e créditos em platform.openai.com'}`);
        }
    }
};
exports.RadarStoriesService = RadarStoriesService;
exports.RadarStoriesService = RadarStoriesService = RadarStoriesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService])
], RadarStoriesService);
//# sourceMappingURL=radar-stories.service.js.map