# 🔒 Arquitetura da Trava de Handoff (IA vs. Humano)

## 1. Problema Identificado
No modelo anterior com n8n, se um atendente humano respondesse ao cliente no WhatsApp ao mesmo tempo em que a IA processava o webhook, ocorriam:
- Respostas duplicadas.
- Quebra de contexto na conversa.
- Respostas inconsistentes da IA sobrepondo o atendente comercial.

## 2. Regra da Trava (Anti-Colisão)
1. **Detecção Imediata**: Quando um atendente envia uma mensagem ou clica em "Assumir Atendimento" na Caixa de Entrada (Inbox), a conversa recebe o status `HUMAN_ACTIVE`.
2. **Lock no Redis / Postgres**: Uma chave de bloqueio é gravada com `ttl` renovável. Qualquer webhook recebido da Meta é encaminhado apenas para o WebSocket dos atendentes, ignorando o processamento do motor de IA.
3. **Devolução Manual ou por Inatividade**:
   - O atendente pode clicar em "Devolver para IA".
   - Caso a conversa fique inativa por X horas (configurável por empresa), a trava é desfeita e a IA volta a responder novos contatos.
