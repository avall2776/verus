# 📋 VERSUS - Checklist de Implementação e Validação End-to-End

---

## 🟢 FASE 1: CONEXÕES WHATSAPP & ENGINE DE MENSAGERIA (/settings/whatsapp)
- [ ] Criar tela de pareamento com suporte a QR Code dinâmico e Meta Cloud API oficial.
- [ ] Implementar polling/WebSocket para detectar conexão da instância em tempo real.
- [ ] Adicionar controles operacionais: Reconectar, Reiniciar Instância e Importar Contatos.
- [ ] Configurar Modo Anti-bloqueio (ritmo de digitação simulada e pausas entre envios).
- [ ] Exibir status dinâmico com indicador verde na Sidebar e contagem de mensagens trafegadas.

---

## 🟢 FASE 2: OPERAÇÃO - MONITOR AO VIVO EM TEMPO REAL (/monitor)
- [ ] Montar Grid de Atendimentos ativos agrupados por setor/departamento (Comercial, Suporte, etc.).
- [ ] Implementar cronômetros de tempo de espera e SLA (ex: "Sem resposta há X min/horas").
- [ ] Adicionar filtro por atendente/colaborador e status do chamado.
- [ ] Implementar clique rápido no card do Monitor para abrir o atendimento na Caixa de Entrada ou assumir o ticket.
- [ ] Sincronizar via WebSockets para atualização instantânea sem recarregar a página.

---

## 🟢 FASE 3: CHAT INTERNO DA EQUIPE (/team-chat)
- [ ] Criar schema no Prisma para canais internos (`TeamChannel`) e mensagens diretas (`TeamMessage`).
- [ ] Implementar visual de duas abas: [Colaboradores] (conversa 1:1) e [Equipes] (canais por departamento).
- [ ] Adicionar compositor de mensagens internas com upload de arquivos, áudios e emojis.
- [ ] Notificações em tempo real com contador de mensagens não lidas no menu lateral.

---

## 🟢 FASE 4: MOTOR DE AUTOMAÇÕES & WORKFLOWS (/settings/automations)
- [ ] Criar tabela de regras `Automation` e logs de execução `AutomationLog` no banco.
- [ ] Configurar worker do BullMQ (`automations-queue`) com suporte a delay para gatilhos de inatividade.
- [ ] Desenvolver construtor visual linear (Gatilho -> Condições -> Ações):
  - Gatilhos: Inatividade de X horas, Mudança de Etapa no Funil, Tag adicionada.
  - Ações: Disparo de template WhatsApp, Troca de responsável/fila, Mover etapa no CRM.
- [ ] Listagem de automações ativas com switch Ativar/Desativar e visualizador de logs.

---

## 🟢 FASE 5: INTEGRAÇÃO MODAL DEAL <-> ATENDIMENTO & CONVERSAS
- [ ] Ligar busca de histórico de conversas do lead diretamente por `contactId`/telefone em qualquer status (Aguardando, Meus, Resolvidos).
- [ ] Ativar modal rápido "Espiar Conversa" sem redirecionamento de tela.
- [ ] Permitir envio de mensagens rápidas diretamente de dentro do DealModal.
- [ ] Garantir salvamento de valor de oportunidade, descrição e motivos de perda com persistência no banco.

---

## 🟢 FASE 6: ANALYTICS, DASHBOARDS E RELATÓRIOS
- [ ] Métricas de Atendimento (`/dashboard/atendimento`):
  - Gráficos de TMA (Tempo Médio de Atendimento) e TMR (Tempo Médio de Resposta).
  - Volume de chamados receptivos vs. ativos e desempenho individual por operador.
- [ ] Métricas de Vendas (`/dashboard/crm`):
  - Taxa de conversão por etapa do funil.
  - Relatório de motivos de perda e valor total ganho/perdido por período.

---

## 🟢 FASE 7: HOMOLOGAÇÃO E AUDITORIA GERAL
- [ ] Teste de ponta a ponta: Lead entra via WhatsApp -> IA atende -> Transborda -> Cria Deal no CRM -> Notifica no Monitor -> Dispara Automação.
- [ ] Validação do Modo Tela Cheia e redimensionamento individual das colunas do Kanban.
- [ ] Auditoria de segurança e tratamento de exceções (sem quebras em tela preta).
