import { z } from 'zod';
export declare const AiResponseSchema: z.ZodObject<{
    resposta_cliente: z.ZodString;
    transferir_vendedor: z.ZodBoolean;
    motivo_transferencia: z.ZodString;
    resumo_atendimento: z.ZodString;
    nome_cliente: z.ZodString;
    produto_interesse: z.ZodString;
}, "strip", z.ZodTypeAny, {
    resposta_cliente?: string;
    transferir_vendedor?: boolean;
    motivo_transferencia?: string;
    resumo_atendimento?: string;
    nome_cliente?: string;
    produto_interesse?: string;
}, {
    resposta_cliente?: string;
    transferir_vendedor?: boolean;
    motivo_transferencia?: string;
    resumo_atendimento?: string;
    nome_cliente?: string;
    produto_interesse?: string;
}>;
export type AiResponseDto = z.infer<typeof AiResponseSchema>;
