import { z } from 'zod';

export const AiResponseSchema = z.object({
  resposta_cliente: z.string().describe("O texto da resposta que será enviado de volta para o cliente via WhatsApp. Se transferir_vendedor for verdadeiro, você DEVE obrigatoriamente preencher este campo com uma mensagem amigável de transição (ex: 'Vou chamar nosso especialista...')."),
  transferir_vendedor: z.boolean().describe("Se verdadeiro, o robô encerra o atendimento e repassa para um vendedor humano. Marque verdadeiro caso o cliente peça para falar com humano, tenha dúvidas complexas, queira fechar negócio ou precise de intervenção técnica."),
  motivo_transferencia: z.string().describe("Breve explicação interna do porquê o atendimento foi transferido. Ex: 'Dúvida complexa', 'Solicitou vendedor'."),
  resumo_atendimento: z.string().describe("Um parágrafo resumindo as dores, necessidades e o contexto da conversa até agora para o vendedor."),
  nome_cliente: z.string().describe("O nome do cliente caso ele tenha informado na conversa. Se não souber, preencha com 'Não informado'."),
  telefone_cliente: z.string().nullable().describe("O telefone ou WhatsApp informado pelo cliente durante a conversa, com DDD se houver. Se não informado, deixe como null."),
  produto_interesse: z.string().describe("Qual o principal produto, serviço ou demanda de interesse do cliente identificada na conversa (ex: Produção de vídeo, Gestão de tráfego, Consultoria, Maquinário, etc). Se não identificado com clareza, preencha com 'Atendimento Comercial'."),
  cidade_uf: z.string().nullable().describe("Cidade e Estado (UF) do cliente caso tenha sido mencionado ou informado na conversa (ex: 'São Paulo - SP', 'Curitiba - PR'). Se não informado, preencha null."),
  email_cliente: z.string().nullable().describe("E-mail informado pelo cliente caso mencionado na conversa. Se não informado, preencha null."),
  empresa_cliente: z.string().nullable().describe("Nome da empresa, organização ou negócio do cliente caso informado na conversa. Se não informado, preencha null."),
  cargo_cliente: z.string().nullable().describe("Cargo, profissão ou função do cliente caso informado na conversa. Se não informado, preencha null."),
  formulario_origem: z.string().nullable().describe("Nome da campanha, formulário ou anúncio de captação de origem caso identificado no contexto. Se não identificado, preencha null.")
});

export type AiResponseDto = z.infer<typeof AiResponseSchema>;
