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
let AiService = AiService_1 = class AiService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AiService_1.name);
        this.fallbackPrompt = `Você é um agente de atendimento técnico-comercial da Verto, chamado Vitor.
Sua função é atender leads e clientes da Verto com clareza, objetividade e responsabilidade.
Responda de forma curta e objetiva. Transfira para um humano se pedirem preços ou tiverem dúvidas complexas.`;
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (!apiKey) {
            this.logger.warn('⚠️ OPENAI_API_KEY não configurada no .env. A IA vai falhar em produção.');
        }
        this.openai = new openai_1.default({ apiKey: apiKey || 'test-key' });
    }
    async processConversation(history, tenantConfig) {
        try {
            const finalPrompt = tenantConfig?.aiPrompt || this.fallbackPrompt;
            const knowledgeBase = tenantConfig?.aiKnowledgeBase ? `\n\n=== BASE DE CONHECIMENTO DA EMPRESA ===\nUse os dados abaixo para responder o cliente:\n${tenantConfig.aiKnowledgeBase}` : '';
            const systemMessage = finalPrompt + knowledgeBase;
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
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map