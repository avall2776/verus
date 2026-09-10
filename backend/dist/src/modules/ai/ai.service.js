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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
const zod_1 = require("openai/helpers/zod");
const response_schema_1 = require("./schemas/response.schema");
const rag_service_1 = require("../rag/services/rag.service");
let AiService = AiService_1 = class AiService {
    constructor(configService, ragService) {
        this.configService = configService;
        this.ragService = ragService;
        this.logger = new common_1.Logger(AiService_1.name);
        this.fallbackPrompt = `Você é Vitor, vendedor técnico da Verto (Sede: Passo Fundo - RS).
  
DIRETRIZES ESTRITAS DE COMPORTAMENTO:
1. Tamanho: Seja extremamente conciso. Responda em no máximo 1 a 3 frases curtas. PROIBIDO enviar blocos de texto ou parágrafos longos.
2. Dinâmica: Faça apenas UMA pergunta por vez para conduzir a qualificação do lead de forma leve. NUNCA despeje toda a ficha técnica de uma vez.
3. Linguagem: Mantenha um tom consultivo, direto e natural de WhatsApp. 
4. PROIBIDO usar clichês de SAC ou encerramentos telemarketing como 'Como posso ajudar hoje?', 'Estou à disposição', 'Se tiver mais dúvidas me avise' ou 'Algo mais?'.
5. Transbordo: Se decidir transferir para um humano, você DEVE obrigatoriamente fornecer uma última resposta amigável avisando o cliente que está repassando o contato.`;
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (!apiKey) {
            this.logger.warn('⚠️ OPENAI_API_KEY não configurada no .env. A IA vai falhar em produção.');
        }
        this.openai = new openai_1.default({ apiKey: apiKey || 'test-key' });
    }
    async processConversation(history, tenantConfig, dynamicContext) {
        try {
            const finalPrompt = tenantConfig?.aiPrompt || this.fallbackPrompt;
            let knowledgeBase = tenantConfig?.aiKnowledgeBase ? `\n\n=== BASE DE CONHECIMENTO MANUAL ===\nUse os dados abaixo para responder o cliente:\n${tenantConfig.aiKnowledgeBase}` : '';
            if (tenantConfig?.id) {
                const lastUserMessage = history.filter(m => m.role === 'user').pop();
                if (lastUserMessage) {
                    const similarChunks = await this.ragService.searchSimilarChunks(tenantConfig.id, lastUserMessage.content, 3);
                    if (similarChunks.length > 0) {
                        knowledgeBase += `\n\n=== BASE DE CONHECIMENTO DINÂMICA (RAG PDF) ===\nUse APENAS as informações abaixo para responder a pergunta se forem relevantes:\n${similarChunks.join('\n---\n')}\n`;
                        this.logger.debug(`Injetou ${similarChunks.length} blocos RAG no contexto.`);
                    }
                }
            }
            const systemMessage = finalPrompt + (dynamicContext || '') + knowledgeBase;
            const messages = [
                { role: 'system', content: systemMessage },
                ...history
            ];
            const completion = await this.openai.beta.chat.completions.parse({
                model: tenantConfig?.aiModel || 'gpt-4o-mini',
                messages: messages,
                response_format: (0, zod_1.zodResponseFormat)(response_schema_1.AiResponseSchema, 'atendimento_result'),
                temperature: tenantConfig?.aiTemperature !== undefined ? tenantConfig.aiTemperature : 0.7,
            });
            const parsedResponse = completion.choices[0].message.parsed;
            if (!parsedResponse) {
                throw new Error('A OpenAI retornou uma resposta nula na estrutura.');
            }
            return parsedResponse;
        }
        catch (error) {
            this.logger.error(`Erro Crítico OpenAI: ${error.message}`);
            throw new common_1.InternalServerErrorException('Falha no motor de IA.');
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        rag_service_1.RagService])
], AiService);
//# sourceMappingURL=ai.service.js.map