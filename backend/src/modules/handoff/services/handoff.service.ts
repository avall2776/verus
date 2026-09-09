/**
 * Módulo de Trava de Handoff (Transbordo Humano) - Projeto VERUS
 * 
 * Regra Crítica de Negócio:
 * - Quando um atendente humano assume a conversa ou envia uma mensagem,
 *   a IA deve ser IMEDIATAMENTE travada para essa conversa específica.
 * - Isso impede conflito e duplicação de respostas entre IA e humanos.
 */

export interface HandoffState {
  conversationId: string;
  isLockedForAi: boolean;
  lockedByUserId?: string;
  lockedAt?: Date;
  reason?: string;
}

export class HandoffService {
  /**
   * Verifica se a IA tem permissão para responder a esta conversa.
   */
  static async canAiRespond(conversationId: string): Promise<boolean> {
    // TODO: Consultar no Redis / Postgres se há trava ativa
    return true;
  }

  /**
   * Trava a conversa para atendimento humano exclusivo.
   * Chamado quando:
   * 1. O lead pede para falar com um humano ("atendente", "humano", etc.)
   * 2. O atendente abre a caixa de entrada e envia uma resposta
   * 3. A IA não souber responder e acionar o transbordo
   */
  static async lockForHuman(
    conversationId: string,
    userId?: string,
    reason: string = 'Atendente assumiu o atendimento'
  ): Promise<void> {
    console.log(`[HANDOFF] 🔒 Conversa ${conversationId} travada para humano. Motivo: ${reason}`);
    // TODO: Gravar trava no banco / Redis e emitir WebSocket para o Inbox
  }

  /**
   * Destrava a conversa e devolve para o robô de IA.
   */
  static async releaseToAi(conversationId: string): Promise<void> {
    console.log(`[HANDOFF] 🔓 Conversa ${conversationId} devolvida para a IA.`);
    // TODO: Remover trava no banco / Redis e reativar IA
  }
}
