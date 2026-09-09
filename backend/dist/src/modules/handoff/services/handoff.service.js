"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandoffService = void 0;
class HandoffService {
    static async canAiRespond(conversationId) {
        return true;
    }
    static async lockForHuman(conversationId, userId, reason = 'Atendente assumiu o atendimento') {
        console.log(`[HANDOFF] 🔒 Conversa ${conversationId} travada para humano. Motivo: ${reason}`);
    }
    static async releaseToAi(conversationId) {
        console.log(`[HANDOFF] 🔓 Conversa ${conversationId} devolvida para a IA.`);
    }
}
exports.HandoffService = HandoffService;
//# sourceMappingURL=handoff.service.js.map