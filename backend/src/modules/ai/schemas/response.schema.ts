import { z } from 'zod';

export const AiResponseSchema = z.object({
  resposta_cliente: z.string().describe("O texto da resposta que será enviado de volta para o cliente via WhatsApp. Se transferir_vendedor for verdadeiro, você DEVE obrigatoriamente preencher este campo com uma mensagem amigável de transição (ex: 'Vou chamar nosso especialista...')."),
  transferir_vendedor: z.boolean().describe("Se verdadeiro, o robô encerra o atendimento e repassa para um vendedor humano. Marque verdadeiro caso o cliente peça para falar com humano, tenha dúvidas complexas, queira fechar negócio ou precise de intervenção técnica."),
  motivo_transferencia: z.string().describe("Breve explicação interna do porquê o atendimento foi transferido. Ex: 'Dúvida complexa', 'Solicitou vendedor'."),
  resumo_atendimento: z.string().describe("Um parágrafo resumindo as dores, necessidades e o contexto da conversa até agora para o vendedor."),
  nome_cliente: z.string().describe("O nome do cliente caso ele tenha informado na conversa. Se não souber, preencha com 'Não informado'."),
  produto_interesse: z.string().describe("Qual o principal produto ou serviço de interesse do cliente (ex: VersátilMAX, Kit Solar, etc).")
});

export type AiResponseDto = z.infer<typeof AiResponseSchema>;
