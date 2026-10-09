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
var SupportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
const prisma_service_1 = require("../../shared/database/prisma.service");
const chat_gateway_1 = require("../chat/chat.gateway");
const support_ai_service_1 = require("./support-ai.service");
let SupportService = SupportService_1 = class SupportService {
    constructor(prisma, configService, supportAiService, chatGateway) {
        this.prisma = prisma;
        this.configService = configService;
        this.supportAiService = supportAiService;
        this.chatGateway = chatGateway;
        this.logger = new common_1.Logger(SupportService_1.name);
        const apiKey = this.configService?.get('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
        this.openai = new openai_1.default({
            apiKey: apiKey || 'dummy-key',
        });
    }
    clearCache() {
        SupportService_1.ticketsCache.clear();
    }
    async findAll(tenantId, filters) {
        const cacheKey = JSON.stringify({ tenantId, filters });
        const cached = SupportService_1.ticketsCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.data;
        }
        const where = {};
        if (filters.isSuperAdmin) {
            if (filters.targetTenantId && filters.targetTenantId !== 'ALL') {
                where.tenantId = filters.targetTenantId;
            }
        }
        else {
            where.tenantId = tenantId;
        }
        if (filters.status && filters.status !== 'ALL') {
            where.status = filters.status;
        }
        if (filters.priority && filters.priority !== 'ALL') {
            where.priority = filters.priority;
        }
        if (filters.category && filters.category !== 'ALL') {
            where.category = filters.category;
        }
        if (filters.userId) {
            where.userId = filters.userId;
        }
        if (filters.search) {
            where.OR = [
                { subject: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const countWhere = { ...where };
        delete countWhere.status;
        let tickets = [];
        let total = 0;
        let open = 0;
        let inProgress = 0;
        let waitingClient = 0;
        let resolved = 0;
        let closed = 0;
        const findTicketsPromise = this.prisma.supportTicket.findMany({
            where,
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        cnpj: true,
                        email: true,
                        phone: true,
                        isActive: true,
                        plan: { select: { name: true } }
                    }
                },
                user: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                },
                assignedTo: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                },
                contact: {
                    select: { id: true, name: true, phone: true, email: true }
                },
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        if (!filters.status || filters.status === 'ALL') {
            tickets = await findTicketsPromise;
            total = tickets.length;
            for (const t of tickets) {
                const s = String(t.status || '').toUpperCase();
                if (s === 'OPEN')
                    open++;
                else if (s === 'IN_PROGRESS')
                    inProgress++;
                else if (s === 'WAITING_CLIENT')
                    waitingClient++;
                else if (s === 'RESOLVED')
                    resolved++;
                else if (s === 'CLOSED')
                    closed++;
            }
        }
        else {
            const [fetchedTickets, statusGroups] = await Promise.all([
                findTicketsPromise,
                this.prisma.supportTicket.groupBy({
                    by: ['status'],
                    where: countWhere,
                    _count: { id: true },
                }),
            ]);
            tickets = fetchedTickets;
            for (const g of statusGroups) {
                const cnt = g._count.id;
                total += cnt;
                const s = String(g.status || '').toUpperCase();
                if (s === 'OPEN')
                    open += cnt;
                else if (s === 'IN_PROGRESS')
                    inProgress += cnt;
                else if (s === 'WAITING_CLIENT')
                    waitingClient += cnt;
                else if (s === 'RESOLVED')
                    resolved += cnt;
                else if (s === 'CLOSED')
                    closed += cnt;
            }
        }
        const result = {
            tickets,
            counts: {
                total,
                open,
                inProgress,
                waitingClient,
                resolved,
                closed
            }
        };
        SupportService_1.ticketsCache.set(cacheKey, {
            data: result,
            expiresAt: Date.now() + 15000,
        });
        return result;
    }
    async findOne(id, tenantId, isSuperAdmin) {
        const where = isSuperAdmin ? { id } : { id, tenantId };
        const ticket = await this.prisma.supportTicket.findFirst({
            where,
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        cnpj: true,
                        email: true,
                        phone: true,
                        address: true,
                        logoUrl: true,
                        isActive: true,
                        createdAt: true,
                        plan: { select: { id: true, name: true, price: true } },
                        whatsappSettings: true,
                        emailSettings: true,
                        metaPhoneNumberId: true,
                        _count: {
                            select: {
                                users: true,
                                contracts: true,
                                contacts: true,
                                supportTickets: true,
                            }
                        }
                    }
                },
                user: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                },
                assignedTo: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                },
                contact: {
                    select: { id: true, name: true, phone: true, email: true }
                },
                messages: {
                    include: {
                        sender: {
                            select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Chamado de suporte não encontrado.');
        }
        return ticket;
    }
    async create(tenantId, userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, role: true }
        });
        const ticket = await this.prisma.supportTicket.create({
            data: {
                subject: dto.subject.trim(),
                description: dto.description.trim(),
                category: dto.category || 'DUVIDA_TECNICA',
                priority: dto.priority || 'MEDIUM',
                status: 'OPEN',
                tenantId,
                userId,
                contactId: dto.contactId || null,
                messages: {
                    create: {
                        senderId: userId,
                        senderName: user?.name || 'Solicitante',
                        senderRole: user?.role || 'USER',
                        content: dto.description.trim(),
                        isInternal: false
                    }
                }
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                },
                tenant: {
                    select: { id: true, name: true }
                },
                messages: true
            }
        });
        this.chatGateway.emitTicketUpdate(tenantId, ticket);
        setTimeout(() => {
            this.supportAiService.handleTicketCreated(ticket.id).catch((err) => {
                this.logger.error(`Erro ao disparar IA para novo chamado #${ticket.ticketNumber}: ${err?.message}`);
            });
        }, 1000);
        this.clearCache();
        return ticket;
    }
    async addMessage(ticketId, tenantId, userId, dto, isSuperAdmin) {
        const where = isSuperAdmin ? { id: ticketId } : { id: ticketId, tenantId };
        const ticket = await this.prisma.supportTicket.findFirst({
            where,
            include: { user: true }
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Chamado de suporte não encontrado.');
        }
        const sender = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, role: true }
        });
        const isInternal = Boolean(dto.isInternal);
        const senderRole = isSuperAdmin ? 'SUPER_ADMIN' : (sender?.role || 'AGENT');
        const message = await this.prisma.ticketMessage.create({
            data: {
                ticketId,
                senderId: userId,
                senderName: sender?.name || (isSuperAdmin ? 'Super Admin' : 'Operador'),
                senderRole,
                content: dto.content.trim(),
                isInternal,
                attachments: dto.attachments || null
            },
            include: {
                sender: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                }
            }
        });
        let nextStatus = ticket.status;
        if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
            nextStatus = 'IN_PROGRESS';
        }
        else if (!isInternal) {
            if (isSuperAdmin || sender?.role === 'ADMIN' || sender?.role === 'AGENT') {
                nextStatus = 'WAITING_CLIENT';
            }
            else {
                nextStatus = 'IN_PROGRESS';
            }
        }
        await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                status: nextStatus,
                updatedAt: new Date()
            }
        });
        const fullTicket = await this.prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true } },
                tenant: { select: { id: true, name: true } },
                messages: { orderBy: { createdAt: 'desc' }, take: 10 }
            }
        });
        this.chatGateway.emitTicketUpdate(ticket.tenantId, {
            ...fullTicket,
            ticketId,
            message,
            status: nextStatus,
        });
        if (!isInternal && !isSuperAdmin && senderRole !== 'SUPER_ADMIN' && senderRole !== 'AI_AGENT') {
            setTimeout(() => {
                this.supportAiService.handleIncomingClientMessage(ticketId, dto.content.trim(), sender?.name || 'Cliente').catch((err) => {
                    this.logger.error(`Erro ao disparar IA para resposta no chamado #${ticket.ticketNumber}: ${err?.message}`);
                });
            }, 1200);
        }
        this.clearCache();
        return message;
    }
    async updateStatus(ticketId, tenantId, status, isSuperAdmin) {
        const validStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED'];
        if (!validStatuses.includes(status)) {
            throw new common_1.BadRequestException(`Status inválido. Escolha entre: ${validStatuses.join(', ')}`);
        }
        const where = isSuperAdmin ? { id: ticketId } : { id: ticketId, tenantId };
        const ticket = await this.prisma.supportTicket.findFirst({ where });
        if (!ticket) {
            throw new common_1.NotFoundException('Chamado de suporte não encontrado.');
        }
        const updated = await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status, updatedAt: new Date() },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                },
                assignedTo: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                }
            }
        });
        this.clearCache();
        return updated;
    }
    async assign(ticketId, tenantId, assignedToId, isSuperAdmin) {
        const where = isSuperAdmin ? { id: ticketId } : { id: ticketId, tenantId };
        const ticket = await this.prisma.supportTicket.findFirst({ where });
        if (!ticket) {
            throw new common_1.NotFoundException('Chamado de suporte não encontrado.');
        }
        const updated = await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                assignedToId: assignedToId || null,
                status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
                updatedAt: new Date()
            },
            include: {
                assignedTo: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                }
            }
        });
        this.clearCache();
        return updated;
    }
    async getNotices(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                name: true,
                whatsappSettings: true,
                emailSettings: true,
                metaPhoneNumberId: true,
                plan: { select: { name: true } },
            }
        });
        const isWhatsappActive = Boolean(tenant?.metaPhoneNumberId || tenant?.whatsappSettings);
        const isEmailActive = Boolean(tenant?.emailSettings);
        return {
            systemStatus: [
                {
                    id: 'ai-vitor',
                    name: 'IA Vitor Online',
                    status: 'OPERATIONAL',
                    label: 'Motor OpenAI / LangChain Ativo',
                    indicator: 'healthy'
                },
                {
                    id: 'whatsapp',
                    name: 'WhatsApp Cloud API',
                    status: isWhatsappActive ? 'OPERATIONAL' : 'CONFIG_REQUIRED',
                    label: isWhatsappActive ? 'Linha Operacional Conectada' : 'Aguardando Pareamento',
                    indicator: isWhatsappActive ? 'healthy' : 'warning'
                },
                {
                    id: 'email-smtp',
                    name: 'Servidor de E-mail SMTP',
                    status: isEmailActive ? 'OPERATIONAL' : 'PENDING_SETUP',
                    label: isEmailActive ? 'Transporte Conectado' : 'Configuração Opcional',
                    indicator: isEmailActive ? 'healthy' : 'neutral'
                },
                {
                    id: 'cloud-infra',
                    name: 'Infraestrutura Cloud Vallor',
                    status: 'OPERATIONAL',
                    label: 'Latência Estável • 99.9% Uptime',
                    indicator: 'healthy'
                }
            ],
            announcements: [
                {
                    id: 'release-v24',
                    title: 'Versão 2.4: Suporte Flutuante & Suíte Comercial',
                    badge: 'Novidade',
                    date: '17/09/2026',
                    description: 'Widget de Suporte Vallor agora integrado em todas as telas da plataforma para consulta de chamados, status do ecossistema e suporte imediato.'
                },
                {
                    id: 'quick-tips',
                    title: 'Produtividade: Atalho de Macros no Chat',
                    badge: 'Dica Rápida',
                    date: '16/09/2026',
                    description: 'Digite "/" no campo de mensagem do WhatsApp para acessar suas Respostas Rápidas instantaneamente e otimizar seu tempo de atendimento.'
                },
                {
                    id: 'security-mp',
                    title: 'Contratos e Propostas com Assinatura Digital Válida',
                    badge: 'Jurídico & Compliance',
                    date: '15/09/2026',
                    description: 'Emissão e assinatura eletrônica em total conformidade com a MP 2.200-2/2001 e Lei 14.063/2020 com trilha de auditoria completa por IP e carimbo de tempo.'
                }
            ]
        };
    }
    async generateCopilotSuggestion(ticketId, tenantId, isSuperAdmin) {
        const where = isSuperAdmin ? { id: ticketId } : { id: ticketId, tenantId };
        const ticket = await this.prisma.supportTicket.findFirst({
            where,
            include: {
                tenant: { select: { name: true, plan: { select: { name: true } } } },
                user: { select: { name: true, email: true, role: true } },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        senderName: true,
                        senderRole: true,
                        content: true,
                        isInternal: true,
                        createdAt: true,
                    }
                }
            }
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Chamado de suporte não encontrado.');
        }
        const clientName = ticket.user?.name || 'Cliente';
        const companyName = ticket.tenant?.name || 'Empresa';
        const messagesHistory = ticket.messages
            .map(m => `[${m.isInternal ? 'NOTA INTERNA' : m.senderRole} - ${m.senderName}]: ${m.content}`)
            .join('\n');
        const prompt = `
Você é o Copiloto IA de Atendimento ao Cliente e Suporte Técnico da plataforma Vallor (SaaS corporativo de CRM Omnichannel, IA de Vendas Vitor, WhatsApp Cloud API, Assinaturas Digitais e Métricas Comerciais).
Sua missão é atuar como copiloto do atendente humano, gerando uma resposta técnica de alto nível, precisa, acolhedora e empática para que o operador humano revise e envie no chat ao vivo.

DADOS DO CHAMADO:
- Protocolo: #${ticket.ticketNumber}
- Empresa Cliente: ${companyName} (Plano: ${ticket.tenant?.plan?.name || 'Pro'})
- Solicitante: ${clientName} (${ticket.user?.email || 'Sem email'})
- Categoria: ${ticket.category}
- Prioridade: ${ticket.priority}
- Status Atual: ${ticket.status}
- Assunto: ${ticket.subject}
- Dúvida / Relato Original: ${ticket.description}

HISTÓRICO DA CONVERSA:
${messagesHistory || 'Apenas a dúvida original relatada acima.'}

INSTRUÇÕES PARA O COPILOTO:
1. Responda como um operador humano experiente, prestativo e cordial ("Olá, ${clientName.split(' ')[0]}! Tudo bem?").
2. Apresente uma solução direta, técnica e prática para o problema relatado, organizando em tópicos quando útil.
3. Se o chamado já estiver pronto ou resolvido, forneça a instrução de validação.
4. Se exigir ação do cliente (ex: reconectar WhatsApp, verificar permissões no painel, checar dados de lead), explique com clareza amigável.
5. Recomende o status ideal para o chamado:
   - "WAITING_CLIENT" se a resposta exigir que o cliente teste ou responda;
   - "RESOLVED" se a solução for conclusiva e a dúvida sanada;
   - "IN_PROGRESS" se houver investigação adicional em andamento.
6. Retorne RIGOROSAMENTE apenas um objeto JSON com a seguinte estrutura:
{
  "summary": "Resumo de 1 frase do que o cliente precisa",
  "suggestedResponse": "Texto pronto e humanizado para o atendente enviar",
  "recommendedStatus": "WAITING_CLIENT" | "RESOLVED" | "IN_PROGRESS",
  "recommendedStatusReason": "Motivo da sugestão de status",
  "keyActions": ["Ação 1 recomendada", "Ação 2 recomendada"]
}
`;
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Você é um assistente técnico especialista em suporte corporativo e CRM. Retorne apenas JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' }
            });
            const content = response.choices[0]?.message?.content;
            if (content) {
                return JSON.parse(content);
            }
        }
        catch (err) {
            this.logger.warn(`Fallback no Copiloto IA para ticket #${ticket.ticketNumber}: ${err?.message}`);
        }
        const firstName = clientName.split(' ')[0];
        return {
            summary: `Atendimento sobre ${ticket.subject} (${ticket.category})`,
            suggestedResponse: `Olá, ${firstName}! Tudo bem?\n\nAnalisamos a sua solicitação sobre "${ticket.subject}". Já realizamos as verificações no ambiente e orientamos seguir os passos indicados no painel Vallor.\n\nFicamos no aguardo da sua confirmação ou caso surja qualquer outra dúvida técnica. Nossa equipe está à total disposição!\n\nAtenciosamente,\nEquipe de Atendimento Vallor`,
            recommendedStatus: 'WAITING_CLIENT',
            recommendedStatusReason: 'Aguardando validação do cliente após orientação técnica.',
            keyActions: [
                'Confirmar parâmetros do tenant',
                'Aguardar retorno do cliente'
            ]
        };
    }
    async getAiConfig() {
        return this.supportAiService.getConfig();
    }
    async updateAiConfig(dto) {
        return this.supportAiService.updateConfig(dto);
    }
    async coachSupportAi(ticketId, dto, userId, isSuperAdmin) {
        if (!isSuperAdmin) {
            throw new common_1.BadRequestException('Apenas operadores administradores master podem orientar a inteligência artificial.');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
        });
        return this.supportAiService.coachFromFeedback(ticketId, dto, userId, user?.name);
    }
    async toggleTicketAi(ticketId, isPaused, tenantId, isSuperAdmin) {
        const where = isSuperAdmin ? { id: ticketId } : { id: ticketId, tenantId };
        const ticket = await this.prisma.supportTicket.findFirst({ where });
        if (!ticket) {
            throw new common_1.NotFoundException('Chamado de suporte não encontrado.');
        }
        const updated = await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                isAiPaused: isPaused,
                updatedAt: new Date(),
            },
            include: {
                user: true,
                assignedTo: true,
                tenant: true,
                messages: {
                    include: { sender: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        this.chatGateway.emitTicketUpdate(ticket.tenantId, updated);
        return updated;
    }
    async submitCsat(ticketId, tenantId, dto) {
        const ticket = await this.prisma.supportTicket.findFirst({
            where: { id: ticketId, tenantId },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Chamado de suporte não encontrado.');
        }
        const updated = await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                satisfactionRating: dto.rating,
                satisfactionFeedback: dto.feedback?.trim() || null,
                updatedAt: new Date(),
            },
            include: {
                user: true,
                assignedTo: true,
                tenant: true,
                messages: {
                    include: { sender: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        this.chatGateway.emitTicketUpdate(tenantId, updated);
        return {
            message: 'Avaliação registrada com sucesso! Muito obrigado pelo seu feedback.',
            ticket: updated,
        };
    }
};
exports.SupportService = SupportService;
SupportService.ticketsCache = new Map();
exports.SupportService = SupportService = SupportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        support_ai_service_1.SupportAiService,
        chat_gateway_1.ChatGateway])
], SupportService);
//# sourceMappingURL=support.service.js.map