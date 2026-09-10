"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiResponseSchema = void 0;
const zod_1 = require("zod");
exports.AiResponseSchema = zod_1.z.object({
    resposta_cliente: zod_1.z.string().describe("O texto da resposta que será enviado de volta para o cliente via WhatsApp. Se transferir_vendedor for verdadeiro, você DEVE obrigatoriamente preencher este campo com uma mensagem amigável de transição (ex: 'Vou chamar nosso especialista...')."),
    transferir_vendedor: zod_1.z.boolean().describe("Se verdadeiro, o robô encerra o atendimento e repassa para um vendedor humano. Marque verdadeiro caso o cliente peça para falar com humano, tenha dúvidas complexas, queira fechar negócio ou precise de intervenção técnica."),
    motivo_transferencia: zod_1.z.string().describe("Breve explicação interna do porquê o atendimento foi transferido. Ex: 'Dúvida complexa', 'Solicitou vendedor'."),
    resumo_atendimento: zod_1.z.string().describe("Um parágrafo resumindo as dores, necessidades e o contexto da conversa até agora para o vendedor."),
    nome_cliente: zod_1.z.string().describe("O nome do cliente caso ele tenha informado na conversa. Se não souber, preencha com 'Não informado'."),
    produto_interesse: zod_1.z.string().describe("Qual o principal produto ou serviço de interesse do cliente (ex: VersátilMAX, Kit Solar, etc).")
});
//# sourceMappingURL=response.schema.js.map