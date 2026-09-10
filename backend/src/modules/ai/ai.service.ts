import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { AiResponseSchema, AiResponseDto } from './schemas/response.schema';
import { RagService } from '../rag/services/rag.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;
  // Prompt Padrão de Fallback (caso o tenant não tenha configurado)
  private readonly fallbackPrompt = `Você é Vitor, vendedor técnico da Verto (Sede: Passo Fundo - RS).
  
DIRETRIZES ESTRITAS DE COMPORTAMENTO:
1. Tamanho: Seja extremamente conciso. Responda em no máximo 1 a 3 frases curtas. PROIBIDO enviar blocos de texto ou parágrafos longos.
2. Dinâmica: Faça apenas UMA pergunta por vez para conduzir a qualificação do lead de forma leve. NUNCA despeje toda a ficha técnica de uma vez.
3. Linguagem: Mantenha um tom consultivo, direto e natural de WhatsApp. 
4. PROIBIDO usar clichês de SAC ou encerramentos telemarketing como 'Como posso ajudar hoje?', 'Estou à disposição', 'Se tiver mais dúvidas me avise' ou 'Algo mais?'.
5. Transbordo: Se decidir transferir para um humano, você DEVE obrigatoriamente fornecer uma última resposta amigável avisando o cliente que está repassando o contato.`;

  constructor(
    private readonly configService: ConfigService,
    private readonly ragService: RagService
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('⚠️ OPENAI_API_KEY não configurada no .env. A IA vai falhar em produção.');
    }

    this.openai = new OpenAI({ apiKey: apiKey || 'test-key' });
  }

  /**
   * Processa o histórico de conversas e gera uma saída estruturada rigorosa baseada em Zod.
   */
  async processConversation(
    history: { role: 'user' | 'assistant', content: string }[],
    tenantConfig?: { id?: string, aiPrompt?: string, aiKnowledgeBase?: string, aiTemperature?: number, aiModel?: string },
    dynamicContext?: string
  ): Promise<AiResponseDto> {
    try {
      const finalPrompt = tenantConfig?.aiPrompt || this.fallbackPrompt;
      let knowledgeBase = tenantConfig?.aiKnowledgeBase ? `\n\n=== BASE DE CONHECIMENTO MANUAL ===\nUse os dados abaixo para responder o cliente:\n${tenantConfig.aiKnowledgeBase}` : '';
      
      // Busca Semântica via RAG
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

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemMessage },
        ...history
      ];

      const completion = await this.openai.beta.chat.completions.parse({
        model: tenantConfig?.aiModel || 'gpt-4o-mini',
        messages: messages,
        response_format: zodResponseFormat(AiResponseSchema, 'atendimento_result'),
        temperature: tenantConfig?.aiTemperature !== undefined ? tenantConfig.aiTemperature : 0.7,
      });

      const parsedResponse = completion.choices[0].message.parsed;

      if (!parsedResponse) {
        throw new Error('A OpenAI retornou uma resposta nula na estrutura.');
      }

      return parsedResponse;
    } catch (error) {
      this.logger.error(`Erro Crítico OpenAI: ${error.message}`);
      throw new InternalServerErrorException('Falha no motor de IA.');
    }
  }
}
