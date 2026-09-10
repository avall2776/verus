import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { AiResponseSchema, AiResponseDto } from './schemas/response.schema';

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

  constructor(private readonly configService: ConfigService) {
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
    tenantConfig?: { aiPrompt: string, aiKnowledgeBase: string, aiTemperature: number, aiModel: string },
    dynamicContext?: string
  ): Promise<AiResponseDto> {
    try {
      const finalPrompt = tenantConfig?.aiPrompt || this.fallbackPrompt;
      const knowledgeBase = tenantConfig?.aiKnowledgeBase ? `\n\n=== BASE DE CONHECIMENTO DA EMPRESA ===\nUse os dados abaixo para responder o cliente:\n${tenantConfig.aiKnowledgeBase}` : '';
      
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
