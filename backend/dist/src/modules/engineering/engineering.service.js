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
var EngineeringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineeringService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
const client_1 = require("@prisma/client");
let EngineeringService = EngineeringService_1 = class EngineeringService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(EngineeringService_1.name);
        this.prisma = new client_1.PrismaClient();
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (!apiKey) {
            this.logger.warn('⚠️ OPENAI_API_KEY não encontrada em ConfigService. Tentando process.env...');
        }
        this.openai = new openai_1.default({
            apiKey: apiKey || process.env.OPENAI_API_KEY || 'dummy-key',
        });
    }
    async getBacklog(filters) {
        const where = {};
        if (filters?.stage && filters.stage !== 'ALL') {
            where.stage = filters.stage;
        }
        if (filters?.category && filters.category !== 'ALL') {
            where.category = filters.category;
        }
        if (filters?.priority && filters.priority !== 'ALL') {
            where.priority = filters.priority;
        }
        if (filters?.search && filters.search.trim()) {
            const q = filters.search.trim();
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { tenantName: { contains: q, mode: 'insensitive' } },
                { assignedTo: { contains: q, mode: 'insensitive' } },
            ];
        }
        const [items, total, captured, aiAnalysis, inDevelopment, deployed] = await Promise.all([
            this.prisma.engineeringItem.findMany({
                where,
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            }),
            this.prisma.engineeringItem.count(),
            this.prisma.engineeringItem.count({ where: { stage: 'CAPTURED' } }),
            this.prisma.engineeringItem.count({ where: { stage: 'AI_ANALYSIS' } }),
            this.prisma.engineeringItem.count({ where: { stage: 'IN_DEVELOPMENT' } }),
            this.prisma.engineeringItem.count({ where: { stage: 'DEPLOYED' } }),
        ]);
        return {
            items,
            stats: {
                total,
                captured,
                aiAnalysis,
                inDevelopment,
                deployed,
            },
        };
    }
    async findById(id) {
        const item = await this.prisma.engineeringItem.findUnique({ where: { id } });
        if (!item) {
            throw new common_1.NotFoundException(`Item de engenharia ${id} não encontrado`);
        }
        return item;
    }
    async create(dto) {
        const defaultChecklist = [
            { id: '1', text: 'Especificar requisitos e arquitetura', done: false },
            { id: '2', text: 'Implementar backend e schemas', done: false },
            { id: '3', text: 'Construir interface frontend no Next.js', done: false },
            { id: '4', text: 'Homologar testes e deploy em produção', done: false },
        ];
        return this.prisma.engineeringItem.create({
            data: {
                title: dto.title,
                description: dto.description,
                stage: dto.stage || 'CAPTURED',
                priority: dto.priority || 'MEDIUM',
                category: dto.category || 'FEATURE',
                sourceType: dto.sourceType || 'MANUAL',
                sourceTicketId: dto.sourceTicketId || null,
                tenantName: dto.tenantName || null,
                aiSummary: dto.aiSummary || null,
                technicalNotes: dto.technicalNotes || null,
                tags: dto.tags || [],
                checklist: defaultChecklist,
                affectedTenants: dto.tenantName ? [{ name: dto.tenantName, date: new Date().toISOString() }] : [],
                affectedCount: 1,
                estimatedHours: dto.estimatedHours || null,
                assignedTo: dto.assignedTo || null,
            },
        });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.engineeringItem.update({
            where: { id },
            data: {
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.stage !== undefined && { stage: dto.stage }),
                ...(dto.priority !== undefined && { priority: dto.priority }),
                ...(dto.category !== undefined && { category: dto.category }),
                ...(dto.aiSummary !== undefined && { aiSummary: dto.aiSummary }),
                ...(dto.technicalNotes !== undefined && { technicalNotes: dto.technicalNotes }),
                ...(dto.tags !== undefined && { tags: dto.tags }),
                ...(dto.estimatedHours !== undefined && { estimatedHours: dto.estimatedHours }),
                ...(dto.assignedTo !== undefined && { assignedTo: dto.assignedTo }),
            },
        });
    }
    async updateChecklist(id, dto) {
        await this.findById(id);
        return this.prisma.engineeringItem.update({
            where: { id },
            data: {
                checklist: dto.checklist,
            },
        });
    }
    async delete(id) {
        await this.findById(id);
        return this.prisma.engineeringItem.delete({ where: { id } });
    }
    async createFromTicket(dto) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id: dto.ticketId },
            include: {
                tenant: { select: { name: true } },
                user: { select: { name: true, email: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });
        if (!ticket) {
            throw new common_1.NotFoundException(`Chamado de suporte ${dto.ticketId} não encontrado.`);
        }
        const tenantName = ticket.tenant?.name || 'Cliente';
        const lastMessages = ticket.messages
            .reverse()
            .map((m) => `[${m.senderRole || 'USER'}]: ${m.content}`)
            .join('\n');
        const activeItems = await this.prisma.engineeringItem.findMany({
            where: { stage: { in: ['CAPTURED', 'AI_ANALYSIS', 'IN_DEVELOPMENT'] } },
            take: 12,
            orderBy: { createdAt: 'desc' },
        });
        if (activeItems.length > 0) {
            try {
                const dedupPrompt = `
Você é o Arquiteto de Software Chefe do VERSUS.
Verifique se o novo chamado de suporte resolvido abaixo refere-se à MESMA falha técnica, bug ou melhoria de algum dos cards já abertos no backlog de engenharia.

NOVO CHAMADO:
ID: #${ticket.ticketNumber}
Assunto: ${ticket.subject}
Descrição: ${ticket.description}
Empresa: ${tenantName}

CARDS ATIVOS NO BACKLOG:
${activeItems
                    .map((i) => `[CARD_ID: ${i.id}] TÍTULO: ${i.title} | CATEGORIA: ${i.category} | DESCRIÇÃO RESUMIDA: ${i.description.slice(0, 200)}`)
                    .join('\n---\n')}

RESPONDA ESTRITAMENTE EM FORMATO JSON:
{
  "matched": boolean,
  "matchedItemId": string | null,
  "confidence": number,
  "reason": string
}
        `.trim();
                const completion = await this.openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: dedupPrompt }],
                    response_format: { type: 'json_object' },
                    temperature: 0.1,
                });
                const resultText = completion.choices[0]?.message?.content;
                if (resultText) {
                    const parsed = JSON.parse(resultText);
                    if (parsed.matched && parsed.matchedItemId) {
                        const matchedItem = activeItems.find((i) => i.id === parsed.matchedItemId);
                        if (matchedItem) {
                            const currentTenants = Array.isArray(matchedItem.affectedTenants)
                                ? [...matchedItem.affectedTenants]
                                : [{ name: matchedItem.tenantName || 'Cliente Original', date: matchedItem.createdAt }];
                            const alreadyAdded = currentTenants.some((t) => t.name === tenantName);
                            if (!alreadyAdded) {
                                currentTenants.push({
                                    name: tenantName,
                                    ticketNumber: ticket.ticketNumber,
                                    date: new Date().toISOString(),
                                });
                            }
                            const newCount = currentTenants.length;
                            let newPriority = matchedItem.priority;
                            if (newCount >= 3) {
                                newPriority = 'CRITICAL';
                            }
                            else if (newCount >= 2 && newPriority === 'LOW') {
                                newPriority = 'HIGH';
                            }
                            else if (newCount >= 2 && newPriority === 'MEDIUM') {
                                newPriority = 'HIGH';
                            }
                            const updatedNotes = `${matchedItem.technicalNotes || ''}\n\n[${new Date().toLocaleDateString('pt-BR')}]: Nova ocorrência similar reportada pela empresa "${tenantName}" (Chamado #${ticket.ticketNumber}). Total de empresas impactadas: ${newCount}. Motivo do agrupamento: ${parsed.reason}`;
                            const updated = await this.prisma.engineeringItem.update({
                                where: { id: matchedItem.id },
                                data: {
                                    affectedTenants: currentTenants,
                                    affectedCount: newCount,
                                    priority: newPriority,
                                    technicalNotes: updatedNotes,
                                },
                            });
                            this.logger.log(`Chamado #${ticket.ticketNumber} agrupado com sucesso no card existente ${matchedItem.id} (${newCount} clientes afetados).`);
                            return {
                                ...updated,
                                isMerged: true,
                                mergeMessage: `Demanda agrupada com sucesso! O problema já constava no card "${matchedItem.title}". Total de clientes impactados elevado para ${newCount} com prioridade ${newPriority}.`,
                            };
                        }
                    }
                }
            }
            catch (err) {
                this.logger.warn(`Falha na checagem de desduplicação por IA: ${err.message}. Criando novo card normalmente.`);
            }
        }
        const defaultTitle = `[Suporte #${ticket.ticketNumber}] ${ticket.subject}`;
        const defaultDescription = `
**Origem do Chamado**: #${ticket.ticketNumber} - ${ticket.subject}
**Cliente**: ${tenantName} (Solicitante: ${ticket.user?.name || 'Usuário'})
**Categoria Original**: ${ticket.category}
**Prioridade**: ${ticket.priority}

### Relato do Problema:
${ticket.description}

### Últimas Interações de Resolução:
${lastMessages || 'Sem mensagens adicionais.'}
    `.trim();
        let category = dto.category || 'FEATURE';
        if (!dto.category) {
            if (ticket.category === 'BUG')
                category = 'BUG_FIX';
            else if (ticket.category === 'SOLICITACAO_RECURSO')
                category = 'FEATURE';
            else if (ticket.category === 'DUVIDA_TECNICA')
                category = 'ARCHITECTURE';
            else
                category = 'PERFORMANCE';
        }
        const defaultChecklist = [
            { id: '1', text: 'Reproduzir cenário reportado pelo cliente', done: false },
            { id: '2', text: 'Diagnosticar queries e serviços envolvidos', done: false },
            { id: '3', text: 'Aplicar correção e validação regressiva', done: false },
            { id: '4', text: 'Deploy em produção e notificação do suporte', done: false },
        ];
        const item = await this.prisma.engineeringItem.create({
            data: {
                title: dto.customTitle || defaultTitle,
                description: defaultDescription,
                stage: 'CAPTURED',
                priority: dto.priority || ticket.priority || 'MEDIUM',
                category,
                sourceType: 'SUPPORT_TICKET',
                sourceTicketId: ticket.id,
                tenantName,
                checklist: defaultChecklist,
                affectedTenants: [{ name: tenantName, ticketNumber: ticket.ticketNumber, date: new Date().toISOString() }],
                affectedCount: 1,
                technicalNotes: dto.technicalNotes || `Importado da Central de Atendimento Omnichannel em ${new Date().toLocaleDateString('pt-BR')}.`,
                tags: ['suporte', ticket.category?.toLowerCase() || 'feedback'],
            },
        });
        this.logger.log(`Ticket #${ticket.ticketNumber} convertido com sucesso no novo item ${item.id}`);
        return item;
    }
    async createCardFromChat(dto) {
        const prompt = `
Você é o Engenheiro de Software Chefe da plataforma VERSUS.
Transforme a ideia/solução técnica discutida no chat abaixo em uma iniciativa estruturada para o Kanban de Engenharia.

CONTEXTO DA CONVERSA:
${dto.messageContext}

RESPONDA ESTRITAMENTE EM JSON COM A SEGUINTE ESTRUTURA:
{
  "title": "Título conciso e profissional da iniciativa técnica",
  "category": "FEATURE" | "API" | "EXTENSION" | "PERFORMANCE" | "BUG_FIX" | "ARCHITECTURE",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "description": "Síntese dos requisitos, regras de negócio e objetivo final",
  "aiSummary": "Plano de arquitetura técnica completo com camadas afetadas (Prisma, NestJS, Next.js), endpoints, snippets de código e estratégia de implementação em Markdown",
  "checklist": [
    { "id": "1", "text": "Passo 1 técnico", "done": false },
    { "id": "2", "text": "Passo 2 técnico", "done": false },
    { "id": "3", "text": "Passo 3 técnico", "done": false },
    { "id": "4", "text": "Passo 4 técnico", "done": false }
  ],
  "tags": ["tag1", "tag2"]
}
    `.trim();
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.3,
            });
            const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
            const item = await this.prisma.engineeringItem.create({
                data: {
                    title: dto.customTitle || parsed.title || 'Nova Iniciativa Gerada por IA',
                    category: dto.category || parsed.category || 'FEATURE',
                    priority: dto.priority || parsed.priority || 'MEDIUM',
                    stage: dto.stage || 'AI_ANALYSIS',
                    description: parsed.description || dto.messageContext,
                    aiSummary: parsed.aiSummary || 'Planejamento técnico estruturado pelo Arquiteto de Software Chefe.',
                    checklist: parsed.checklist || [
                        { id: '1', text: 'Estruturar arquitetura e dependências', done: false },
                        { id: '2', text: 'Desenvolver backend NestJS', done: false },
                        { id: '3', text: 'Implementar interface Next.js', done: false },
                        { id: '4', text: 'Deploy e homologação', done: false },
                    ],
                    tags: parsed.tags || ['ia-architect', 'chat-generator'],
                    sourceType: 'AI_PROPOSAL',
                    tenantName: 'Inovação Interna VERSUS',
                    affectedCount: 1,
                },
            });
            this.logger.log(`Card ${item.id} criado diretamente a partir do chat com a IA.`);
            return item;
        }
        catch (err) {
            this.logger.error(`Erro ao criar card pelo chat: ${err.message}`);
            return this.prisma.engineeringItem.create({
                data: {
                    title: dto.customTitle || 'Nova Iniciativa de Engenharia',
                    category: dto.category || 'FEATURE',
                    priority: dto.priority || 'MEDIUM',
                    stage: dto.stage || 'AI_ANALYSIS',
                    description: dto.messageContext,
                    sourceType: 'AI_PROPOSAL',
                    tenantName: 'Inovação Interna VERSUS',
                    checklist: [
                        { id: '1', text: 'Refinar escopo técnico', done: false },
                        { id: '2', text: 'Desenvolvimento e testes', done: false },
                    ],
                },
            });
        }
    }
    async analyzeItemWithAI(id) {
        const item = await this.findById(id);
        const prompt = `
Você é o Arquiteto de Software Chefe (Principal Software Engineer) da plataforma VERSUS.
A plataforma VERSUS é construída com:
- Backend: Node.js, NestJS, TypeScript, Prisma ORM, PostgreSQL (Supabase com extensão pgvector), Redis BullMQ, Socket.io, Sentry, Meta Cloud API (WhatsApp Oficial).
- Frontend: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons, design monocromático de alta densidade (#0B1224).

Analise o seguinte item do backlog técnico de produto:
TÍTULO: ${item.title}
CATEGORIA: ${item.category}
PRIORIDADE: ${item.priority}
ORIGEM: ${item.sourceType} (${item.tenantName || 'Interno'})
DESCRIÇÃO:
${item.description}

Gere um Parecer Técnico e Plano de Engenharia objetivo, direto e prático em Markdown contendo:
1. 🎯 **Diagnóstico & Objetivo Técnico**: Síntese do que precisa ser construído ou ajustado.
2. 🏗️ **Arquitetura & Camadas Afetadas**: Componentes (Backend Modules, Controllers, Services, Prisma Schema, Frontend Components) que precisam de alteração.
3. 🛠️ **Estratégia de Implementação**: Passo a passo técnico para os desenvolvedores.
4. ⚠️ **Riscos & Impacto em Produção**: O que deve ser testado (concorrência, locks, performance, retrocompatibilidade).
5. ⏱️ **Complexidade Estimada**: P / M / G (e estimativa de horas recomendadas).
    `.trim();
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'Você é o Engenheiro de Software Chefe da plataforma SaaS VERSUS. Responda em Português do Brasil com rigor técnico e foco em excelência arquitetural.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.4,
                max_tokens: 1500,
            });
            const aiSummary = completion.choices[0]?.message?.content || 'Análise concluída sem saída de texto.';
            const updated = await this.prisma.engineeringItem.update({
                where: { id },
                data: {
                    aiSummary,
                    stage: item.stage === 'CAPTURED' ? 'AI_ANALYSIS' : item.stage,
                },
            });
            return updated;
        }
        catch (error) {
            this.logger.error(`Erro ao invocar OpenAI para análise do item ${id}: ${error.message}`);
            const fallbackSummary = `
### 🧠 Parecer Preliminar de Engenharia (Modo Local)
- **Diagnóstico**: A demanda "${item.title}" requer revisão nos módulos de backend e interfaces de frontend.
- **Camadas Sugeridas**: Prisma Schema, Controllers RESTful e Views no Next.js 14.
- **Recomendação**: Alinhar requisitos com o time de atendimento e avaliar impacto em concorrência.
*(Nota: Configure uma chave OpenAI válida para obter análise profunda com snippets de código).*
      `.trim();
            return this.prisma.engineeringItem.update({
                where: { id },
                data: {
                    aiSummary: fallbackSummary,
                    stage: item.stage === 'CAPTURED' ? 'AI_ANALYSIS' : item.stage,
                },
            });
        }
    }
    async chatWithEngineeringAI(dto) {
        const backlogSummary = await this.prisma.engineeringItem.findMany({
            select: {
                id: true,
                title: true,
                stage: true,
                priority: true,
                category: true,
            },
            take: 15,
            orderBy: { createdAt: 'desc' },
        });
        let contextSpecific = '';
        if (dto.contextItemId) {
            const specificItem = await this.prisma.engineeringItem.findUnique({
                where: { id: dto.contextItemId },
            });
            if (specificItem) {
                contextSpecific = `\n\nITEM EM FOCO NA CONVERSA:\nID: ${specificItem.id}\nTítulo: ${specificItem.title}\nDescrição: ${specificItem.description}\nEstágio: ${specificItem.stage}\nResumo IA prévio: ${specificItem.aiSummary || 'Nenhum'}`;
            }
        }
        const systemPrompt = `
Você é o Engenheiro de Software Chefe e Arquiteto de Soluções da plataforma VERSUS (VERSUS Master Platform).
Sua missão é liderar a estratégia tecnológica, evolução de produto, arquitetura de sistemas, design de APIs, otimização de banco de dados e resolução de feedbacks trazidos pelos clientes da plataforma.

STACK TECNOLÓGICO DO VERSUS:
- Arquitetura: Monorepo / Multi-serviço (Backend NestJS + Frontend Next.js 14 App Router).
- Backend: Node.js 20+, NestJS com TypeScript, Prisma ORM 5.22, PostgreSQL 16 (Supabase com suporte a pgvector), Redis 7 (BullMQ para filas de mensagens e webhooks), Socket.io para WebSocket em tempo real.
- Integrações Críticas: WhatsApp Cloud API Oficial (Meta Graph API), Webhooks assíncronos, OpenAI (GPT-4o, Embeddings text-embedding-3-small), Nodemailer (SMTP corporativo), Sentry DSN.
- Frontend: Next.js 14, React 18, Tailwind CSS, Lucide Icons, Axios, Sonner Toasts, layout monocromático (#0B1224, #070D1B, #0F172A).

BACKLOG TÉCNICO ATUAL (AMOSTRA RECENTE):
${JSON.stringify(backlogSummary, null, 2)}
${contextSpecific}

DIRETRIZES DE RESPOSTA:
1. Postura de Líder Técnico: Seja propositivo, analítico, focado em alta disponibilidade, escalabilidade, segurança e padrões de código limpos.
2. Formato: Utilize Markdown rico com títulos, bullets e blocos de código com linguagem especificada (ex: \`\`\`typescript, \`\`\`sql) quando relevante.
3. Proatividade para o Kanban: Sempre que projetar uma solução ou arquitetura concreta para o usuário, encerre sua resposta avisando que ele pode clicar no botão de ação abaixo ou pedir para você criar o card diretamente no Kanban de Engenharia!
4. Idioma: Português do Brasil impecável.
    `.trim();
        const conversationMessages = [{ role: 'system', content: systemPrompt }];
        if (dto.history && Array.isArray(dto.history)) {
            for (const msg of dto.history.slice(-8)) {
                conversationMessages.push({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content,
                });
            }
        }
        conversationMessages.push({ role: 'user', content: dto.message });
        try {
            await this.prisma.engineeringChatMessage.create({
                data: { role: 'user', content: dto.message },
            });
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: conversationMessages,
                temperature: 0.5,
                max_tokens: 1800,
            });
            const reply = completion.choices[0]?.message?.content || 'Não foi possível gerar a resposta no momento.';
            const savedReply = await this.prisma.engineeringChatMessage.create({
                data: { role: 'assistant', content: reply },
            });
            return {
                reply,
                id: savedReply.id,
                createdAt: savedReply.createdAt,
            };
        }
        catch (error) {
            this.logger.error(`Erro no chat com IA de engenharia: ${error.message}`);
            const fallbackReply = `
Olá! Como Engenheiro de Software Chefe do VERSUS, registrei sua solicitação: "${dto.message}".
No momento a API OpenAI retornou uma indisponibilidade temporária.
Recomendo verificar a configuração de \`OPENAI_API_KEY\` no servidor. Enquanto isso, posso estruturar sua demanda diretamente criando uma nova iniciativa no Kanban.
      `.trim();
            const savedReply = await this.prisma.engineeringChatMessage.create({
                data: { role: 'assistant', content: fallbackReply },
            });
            return {
                reply: fallbackReply,
                id: savedReply.id,
                createdAt: savedReply.createdAt,
            };
        }
    }
    async syncDeploy() {
        const updated = await this.prisma.engineeringItem.updateMany({
            where: { stage: 'IN_DEVELOPMENT' },
            data: {
                stage: 'DEPLOYED',
            },
        });
        this.logger.log(`Sincronização de Deploy: ${updated.count} itens movidos para DEPLOYED.`);
        return {
            success: true,
            count: updated.count,
            message: `${updated.count} iniciativas foram marcadas como Deploy Realizado com sucesso!`,
        };
    }
    async getChatHistory() {
        return this.prisma.engineeringChatMessage.findMany({
            orderBy: { createdAt: 'asc' },
            take: 50,
        });
    }
    async clearChatHistory() {
        await this.prisma.engineeringChatMessage.deleteMany({});
        return { success: true, message: 'Histórico do chat de engenharia limpo com sucesso.' };
    }
    async transcribeAudio(file) {
        try {
            const audioFile = await (0, openai_1.toFile)(file.buffer, file.originalname || 'audio.webm', {
                type: file.mimetype || 'audio/webm',
            });
            const response = await this.openai.audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-1',
                language: 'pt',
            });
            return { text: response.text };
        }
        catch (error) {
            this.logger.error(`Erro ao transcrever áudio com Whisper: ${error.message}`);
            throw new common_1.BadRequestException(`Falha ao transcrever áudio: ${error.message}`);
        }
    }
};
exports.EngineeringService = EngineeringService;
exports.EngineeringService = EngineeringService = EngineeringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EngineeringService);
//# sourceMappingURL=engineering.service.js.map