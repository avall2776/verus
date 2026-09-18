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
        this.fallbackPrompt = `Você é Vitor, vendedor técnico e assistente consultivo da Verto (Sede: Passo Fundo - RS).
  
DIRETRIZES ESTRITAS DE COMPORTAMENTO:
1. Tamanho: Seja extremamente conciso. Responda em no máximo 1 a 3 frases curtas. PROIBIDO enviar blocos de texto ou parágrafos longos.
2. Dinâmica: Faça apenas UMA pergunta por vez para conduzir a qualificação do lead de forma leve. NUNCA despeje toda a ficha técnica de uma vez.
3. Linguagem: Mantenha um tom consultivo, direto e natural de WhatsApp. 
4. PROIBIDO usar clichês de SAC ou encerramentos telemarketing como 'Como posso ajudar hoje?', 'Estou à disposição', 'Se tiver mais dúvidas me avise' ou 'Algo mais?'.
5. Transbordo: Se decidir transferir para um humano, você DEVE obrigatoriamente fornecer uma última resposta amigável avisando o cliente que está repassando o contato.
6. SUPORTE MULTIMODAL COMPLETO:
   - Você ouve e compreende perfeitamente áudios e mensagens de voz do cliente (que chegam transcritos como '🎤 [Áudio]: ...').
   - Você analisa e compreende fotos, prints e comprovantes de pagamento (que chegam detalhados como '📷 [Análise da Imagem]: ...').
   - Você lê e extrai dados de documentos e PDFs (que chegam com o texto extraído como '📄 [Documento PDF]: ...').
   - É ESTRITAMENTE PROIBIDO recusar mídias ou dizer 'não posso ouvir áudio', 'não recebo arquivos' ou 'só aceito texto'. Responda diretamente ao conteúdo falado, analisado ou documento com naturalidade!`;
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (!apiKey) {
            this.logger.warn('⚠️ OPENAI_API_KEY não configurada no .env. A IA vai falhar em produção.');
        }
        this.openai = new openai_1.default({ apiKey: apiKey || 'test-key' });
    }
    async transcribeAudio(buffer, filename = 'audio.ogg', mimeType = 'audio/ogg') {
        try {
            this.logger.log(`[Multimodal Audio] Transcrevendo áudio com Whisper (${buffer.length} bytes)...`);
            const safeFilename = filename || 'audio.ogg';
            const safeMime = mimeType || 'audio/ogg';
            const audioFile = await (0, openai_1.toFile)(buffer, safeFilename, { type: safeMime });
            const transcription = await this.openai.audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-1',
                language: 'pt',
            });
            const text = (transcription.text || '').trim();
            this.logger.log(`[Multimodal Audio] Transcrição concluída com sucesso: "${text.slice(0, 100)}..."`);
            return text;
        }
        catch (error) {
            this.logger.error(`[Multimodal Audio] Falha ao transcrever com Whisper: ${error.message}`);
            return '';
        }
    }
    async analyzeImage(buffer, mimeType = 'image/jpeg', caption) {
        try {
            this.logger.log(`[Multimodal Vision] Analisando imagem (${buffer.length} bytes)...`);
            const base64Data = buffer.toString('base64');
            const cleanMime = (mimeType || 'image/jpeg').split(';')[0].trim();
            const dataUrl = `data:${cleanMime};base64,${base64Data}`;
            const prompt = `Analise detalhadamente a imagem enviada pelo cliente no WhatsApp:
1. Se for um comprovante de pagamento (PIX, TED, DOC ou Boleto): extraia o valor exato (R$), data e horário, nome/chave do favorecido, pagador, instituição bancária e autenticação.
2. Se for um documento de identificação (RG, CNH, CPF): extraia o nome completo, CPF, número do documento e validade.
3. Se for uma nota fiscal, fatura, contrato ou proposta comercial: extraia os valores, serviços/produtos descritos e prazos.
4. Se for print de tela de erro, gráfico, foto de produto ou foto geral: descreva o que está visível com precisão.
${caption ? `Legenda enviada pelo cliente: "${caption}"` : ''}
Responda de forma concisa e factual em português (máximo de 3 a 4 linhas).`;
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } }
                        ]
                    }
                ],
                max_tokens: 350,
                temperature: 0.2,
            });
            const analysis = (response.choices[0]?.message?.content || '').trim();
            this.logger.log(`[Multimodal Vision] Análise de imagem concluída: "${analysis.slice(0, 100)}..."`);
            return analysis;
        }
        catch (error) {
            this.logger.error(`[Multimodal Vision] Falha ao analisar imagem: ${error.message}`);
            return caption ? `Foto anexada com legenda: "${caption}"` : 'Foto anexada pelo cliente.';
        }
    }
    async extractDocumentText(buffer, mimeType = 'application/pdf', filename = 'documento.pdf') {
        try {
            this.logger.log(`[Multimodal Doc] Extraindo texto de "${filename}" (${buffer.length} bytes)...`);
            const isPdf = mimeType.includes('pdf') || filename.toLowerCase().endsWith('.pdf');
            if (isPdf) {
                const pdfParse = require('pdf-parse');
                const data = await pdfParse(buffer);
                const text = (data.text || '').replace(/\s+/g, ' ').trim();
                if (text) {
                    const truncated = text.slice(0, 3500);
                    this.logger.log(`[Multimodal Doc] Extraído com sucesso ${truncated.length} caracteres do PDF.`);
                    return truncated;
                }
                return '[Documento PDF digital anexado (arquivo sem camada de texto legível ou baseado em imagem/escaneamento)]';
            }
            if (mimeType.includes('text') || filename.endsWith('.txt') || filename.endsWith('.csv')) {
                return buffer.toString('utf8').slice(0, 3500);
            }
            return `[Arquivo "${filename}" anexado pelo cliente]`;
        }
        catch (error) {
            this.logger.error(`[Multimodal Doc] Falha ao extrair texto do documento: ${error.message}`);
            return `[Documento "${filename}" anexado pelo cliente]`;
        }
    }
    async processConversation(history, tenantConfig, dynamicContext) {
        try {
            const basePrompt = tenantConfig?.aiPrompt || this.fallbackPrompt;
            const multimodalDirective = `\n\n=== REGRAS DE CAPACIDADE MULTIMODAL ATIVA ===
- Você possui capacidade multimodal total: ouve áudios perfeitamente (chegam como '🎤 [Áudio]: ...'), analisa imagens e comprovantes (chegam como '📷 [Análise da Imagem]: ...') e lê documentos/PDFs (chegam como '📄 [Documento PDF]: ...').
- É ESTRITAMENTE PROIBIDO dizer que 'não pode ouvir áudios', 'não pode receber fotos/arquivos' ou pedir para o cliente mandar em texto. O conteúdo das mídias já está legível para você. Responda diretamente e com naturalidade ao que o cliente falou, mandou ou perguntou.`;
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
            const systemMessage = basePrompt + multimodalDirective + (dynamicContext || '') + knowledgeBase;
            const messages = [
                { role: 'system', content: systemMessage },
                ...history
            ];
            const rawTemp = tenantConfig?.aiTemperature !== undefined ? Number(tenantConfig.aiTemperature) : 0.7;
            const safeTemp = isNaN(rawTemp) ? 0.7 : Math.min(Math.max(rawTemp, 0), 1.5);
            const targetModel = (tenantConfig?.aiModel === 'gpt-4o' || tenantConfig?.aiModel === 'gpt-4o-mini')
                ? tenantConfig.aiModel
                : 'gpt-4o-mini';
            const completion = await this.openai.beta.chat.completions.parse({
                model: targetModel,
                messages: messages,
                response_format: (0, zod_1.zodResponseFormat)(response_schema_1.AiResponseSchema, 'atendimento_result'),
                temperature: safeTemp,
            });
            const parsedResponse = completion.choices[0]?.message?.parsed;
            if (!parsedResponse) {
                throw new Error('A OpenAI retornou uma resposta nula na estrutura.');
            }
            return parsedResponse;
        }
        catch (error) {
            this.logger.error(`Erro Crítico OpenAI: ${error?.message || error}`, error?.stack);
            throw new common_1.InternalServerErrorException(error?.message || 'Falha no motor de IA.');
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