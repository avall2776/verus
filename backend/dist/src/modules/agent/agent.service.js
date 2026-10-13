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
var AgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const ai_service_1 = require("../ai/ai.service");
const openai_1 = require("openai");
let AgentService = AgentService_1 = class AgentService {
    constructor(prisma, aiService) {
        this.prisma = prisma;
        this.aiService = aiService;
        this.logger = new common_1.Logger(AgentService_1.name);
    }
    async getConfig(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                aiName: true,
                aiModel: true,
                aiPrompt: true,
                aiKnowledgeBase: true,
                aiTemperature: true,
            },
        });
        return tenant;
    }
    async updateConfig(tenantId, data) {
        const rawTemp = data.aiTemperature !== undefined ? parseFloat(String(data.aiTemperature)) : 0.7;
        const safeTemp = isNaN(rawTemp) ? 0.7 : Math.min(Math.max(rawTemp, 0), 1.5);
        const safeModel = (data.aiModel === 'gpt-4o' || data.aiModel === 'gpt-4o-mini') ? data.aiModel : 'gpt-4o-mini';
        return this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                aiName: data.aiName,
                aiModel: safeModel,
                aiPrompt: data.aiPrompt,
                aiKnowledgeBase: data.aiKnowledgeBase,
                aiTemperature: safeTemp,
            },
            select: {
                id: true,
                name: true,
                aiName: true,
                aiModel: true,
                aiPrompt: true,
                aiKnowledgeBase: true,
                aiTemperature: true,
            },
        });
    }
    async getTrainingLogs(tenantId, limit = 25) {
        return this.prisma.agentTrainingLog.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async coachAgent(tenantId, dto, userId, userName) {
        const feedback = dto.feedback?.trim();
        if (!feedback) {
            throw new common_1.BadRequestException('A instrução de treinamento não pode ser vazia.');
        }
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                aiName: true,
                aiModel: true,
                aiPrompt: true,
                aiKnowledgeBase: true,
                aiTemperature: true,
                aiCustomApiKey: true,
                aiPlatformKeyAllowed: true,
                aiTrialStartedAt: true,
                aiTrialDays: true,
            },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Empresa não encontrada.');
        }
        const agentName = tenant.aiName?.trim() || 'Sofia';
        const companyName = tenant.name || 'Empresa';
        const keyResolution = this.aiService.resolveTenantApiKey(tenant);
        const apiKey = keyResolution.apiKey || this.aiService.masterApiKey;
        if (!apiKey) {
            throw new common_1.BadRequestException('Nenhuma chave OpenAI ativa para processar o treinamento.');
        }
        const openai = new openai_1.default({ apiKey, timeout: 25000 });
        const promptSystem = `Você é o Arquiteto Neural e Curador Oficial de Treinamento do Agente de Inteligência Artificial da empresa "${companyName}".
O nome oficial do atendente virtual é "${agentName}". Ele atua no atendimento a clientes, qualificação de leads, WhatsApp e CRM comercial da empresa.
Sua responsabilidade é processar a orientação e o feedback do Administrador para ajustar, corrigir e ensinar o atendente virtual de maneira definitiva e profissional.

ESTRUTURA DE CAMADAS DO AGENTE:
1. "PROMPT_PERSONA" (Roteiro & Persona):
   Tom de voz, cordialidade, saudações, postura comercial, postura consultiva (SDR), conduta de qualificação e como conduzir o diálogo.
2. "KNOWLEDGE_BASE" (Base de Conhecimento Manual):
   Informações sobre produtos, serviços, valores, planos, condições, prazos, políticas, perguntas frequentes (FAQ), dados institucionais e regras de negócio.
3. "GUARDRAILS" (Cancelas de Segurança & Restrições Comerciais):
   O que o atendente NUNCA deve prometer, limites de desconto, o que não pode ofertar e regras de encaminhamento para a equipe humana.
4. "MULTIPLE":
   Quando a instrução precisa ser distribuída entre o roteiro e a base de conhecimento de forma complementar.

CONFIGURAÇÃO ATUAL DO AGENTE:
--- INÍCIO ROTEIRO / PROMPT DO AGENTE ---
${tenant.aiPrompt || ''}
--- FIM ROTEIRO / PROMPT DO AGENTE ---

--- INÍCIO BASE DE CONHECIMENTO MANUAL ---
${tenant.aiKnowledgeBase || ''}
--- FIM BASE DE CONHECIMENTO MANUAL ---

${dto.quotedText ? `TRECHO EM DISCUSSÃO (RESPOSTA DO AGENTE SIMULADA OU REAL):\n"${dto.quotedText}"\n` : ''}

INSTRUÇÃO / FEEDBACK DE TREINAMENTO DO ADMINISTRADOR:
"${feedback}"

SUA TAREFA:
1. Analise cuidadosamente a instrução do administrador.
2. Identifique qual camada (PROMPT_PERSONA, KNOWLEDGE_BASE, GUARDRAILS ou MULTIPLE) deve ser atualizada.
3. Atualize o texto correspondente da camada identificada.
   - NUNCA apague instruções válidas pré-existentes.
   - Integre a nova diretriz de forma coesa, clara e profissional.
   - Mantenha linguagem natural em português do Brasil sem jargões confusos.
4. Responda ESTRITAMENTE em formato JSON:
{
  "targetCategory": "PROMPT_PERSONA" | "KNOWLEDGE_BASE" | "GUARDRAILS" | "MULTIPLE",
  "categoryLabel": "Roteiro & Persona" | "Base de Conhecimento" | "Cancelas de Segurança" | "Múltiplas Camadas",
  "explanation": "Explicação formal em português sobre o que foi assimilado e onde foi registrado",
  "learnedRule": "Resumo objetivo e claro da diretriz aprendida",
  "updatedPrompt": "Texto completo e revisado do prompt/roteiro ou null se inalterado",
  "updatedKnowledgeBase": "Texto completo e revisado da base de conhecimento ou null se inalterado"
}

ATENÇÃO: Mantenha padrão corporativo, formal e de alto nível. Não use caracteres excessivos de formatação como asteriscos duplos.`;
        let parsedResult = null;
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: promptSystem },
                    { role: 'user', content: `Processe o treinamento do atendente ${agentName}: "${feedback}"` },
                ],
                temperature: 0.2,
                response_format: { type: 'json_object' },
            });
            const raw = response.choices[0]?.message?.content;
            if (raw) {
                parsedResult = JSON.parse(raw);
            }
        }
        catch (llmErr) {
            this.logger.error(`Erro ao chamar OpenAI para treinamento do agente do tenant: ${llmErr?.message}`, llmErr.stack);
        }
        if (!parsedResult) {
            parsedResult = {
                targetCategory: 'KNOWLEDGE_BASE',
                categoryLabel: 'Base de Conhecimento',
                explanation: 'Diretriz incorporada nas notas de aprendizado da base de conhecimento da empresa.',
                learnedRule: feedback,
                updatedKnowledgeBase: `${tenant.aiKnowledgeBase || ''}\n\n[DIRETRIZ APRENDIDA VIA MENTORIA]:\n${feedback}`,
            };
        }
        const finalRule = (parsedResult.learnedRule || feedback).trim();
        const targetCat = String(parsedResult.targetCategory || 'PROMPT_PERSONA').toUpperCase();
        const updateData = {};
        if (targetCat === 'PROMPT_PERSONA' || targetCat.includes('PROMPT') || targetCat.includes('PERSONA') || targetCat === 'MULTIPLE' || targetCat === 'GUARDRAILS') {
            let promptText = (parsedResult.updatedPrompt && typeof parsedResult.updatedPrompt === 'string' && parsedResult.updatedPrompt.length > 20)
                ? parsedResult.updatedPrompt.trim()
                : (tenant.aiPrompt || '');
            if (!promptText.toLowerCase().includes(finalRule.toLowerCase())) {
                const header = '\n\n### DIRETRIZES APRENDIDAS VIA MENTORIA:';
                if (promptText.includes('### DIRETRIZES APRENDIDAS VIA MENTORIA:')) {
                    promptText += `\n- [DIRETRIZ]: ${finalRule}`;
                }
                else {
                    promptText += `${header}\n- [DIRETRIZ]: ${finalRule}`;
                }
            }
            updateData.aiPrompt = promptText;
        }
        if (targetCat === 'KNOWLEDGE_BASE' || targetCat.includes('KNOWLEDGE') || targetCat === 'MULTIPLE') {
            let kbText = (parsedResult.updatedKnowledgeBase && typeof parsedResult.updatedKnowledgeBase === 'string' && parsedResult.updatedKnowledgeBase.length > 20)
                ? parsedResult.updatedKnowledgeBase.trim()
                : (tenant.aiKnowledgeBase || '');
            if (!kbText.toLowerCase().includes(finalRule.toLowerCase())) {
                const header = '\n\n### DIRETRIZES COMERCIAIS & TÉCNICAS INCORPORADAS VIA MENTORIA:';
                if (kbText.includes('### DIRETRIZES COMERCIAIS & TÉCNICAS INCORPORADAS VIA MENTORIA:')) {
                    kbText += `\n- [REGRA]: ${finalRule}`;
                }
                else {
                    kbText += `${header}\n- [REGRA]: ${finalRule}`;
                }
            }
            updateData.aiKnowledgeBase = kbText;
        }
        if (Object.keys(updateData).length === 0) {
            updateData.aiPrompt = `${tenant.aiPrompt || ''}\n\n### DIRETRIZES APRENDIDAS VIA MENTORIA:\n- [DIRETRIZ]: ${finalRule}`;
        }
        const updatedTenant = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: updateData,
            select: {
                id: true,
                name: true,
                aiName: true,
                aiModel: true,
                aiPrompt: true,
                aiKnowledgeBase: true,
                aiTemperature: true,
            },
        });
        const log = await this.prisma.agentTrainingLog.create({
            data: {
                tenantId,
                userId: userId || null,
                userName: userName || 'Super Admin',
                feedback,
                quotedText: dto.quotedText?.trim() || null,
                targetCategory: parsedResult.targetCategory || 'KNOWLEDGE_BASE',
                categoryLabel: parsedResult.categoryLabel || 'Base de Conhecimento',
                explanation: parsedResult.explanation || 'Diretriz assimilada com sucesso.',
                learnedRule: finalRule,
            },
        });
        return {
            success: true,
            parsedResult,
            updatedConfig: updatedTenant,
            log,
            confirmationMessage: `Orientação assimilada com sucesso por ${agentName} (${companyName}) na camada ${parsedResult.categoryLabel || 'Base de Conhecimento'}.`,
        };
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = AgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService])
], AgentService);
//# sourceMappingURL=agent.service.js.map