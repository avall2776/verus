# 📋 VERSUS SAAS - CHECKLIST & DIÁRIO DE BORDO DO PROJETO

Documento oficial de acompanhamento do ciclo de desenvolvimento, homologações em produção e próximos passos.

---

## 📅 SEXTA-FEIRA (11/09/2026) - ENTREGAS REALIZADAS À TARDE

### 1. 🤖 Fluxo de Entrada e Disparo de IA Vitor Online (`backend/src/modules/queues`)
- [x] **Iniciação de Fila Desatendida**: Ao receber mensagem de contato sem chamado aberto, o atendimento é iniciado como `status: 'bot_active'` e `assignedTo: null`.
- [x] **Não-Atribuição Indevida**: Chamados nunca são atribuídos automaticamente ao usuário admin ou operadores logados.
- [x] **Reabertura Automática de Resolvidos**: Mensagens recebidas de leads finalizados reabrem a conversa com `status: 'bot_active'` e `assignedTo: null`.
- [x] **Fila Correta**: Os chamados entram exclusivamente na aba **"Aguardando"** (fila do Bot) e jamais na aba "Meus".
- [x] **Disparo Autônomo da IA**: Motor OpenAI/LangChain responde ativamente enquanto `bot_active = true`.

### 2. 🛡️ Modal Central de Assunção de Fila / IA (`frontend/src/app/(dashboard)/inbox`)
- [x] **Interceptação de Fila (Padrão Lero)**: Ao clicar em um card que esteja na fila (`waiting`, `bot_active` ou `assignedTo === null`), abre o **Modal Central de Assunção** com backdrop escuro:
  - **Identificação da Fila**: Exibe o nome da fila (*"IA Vitor Online"* ou *"Fila de Espera"*).
  - **Preview do Lead**: Avatar, nome, telefone, badge de status e última mensagem enviada.
  - **Ação 1 (Botão verde principal)**: *"Atribuir atendimento para mim"* — executa takeover via API (`/takeover`), altera status para `human_takeover`, atribui ao operador logado e abre o chat pronto para digitação na aba "Meus".
  - **Ação 2**: *"Transferir atendimento"* — abre o seletor de departamentos para direcionamento de setor.
  - **Ação 3**: *"Espiar conversa (somente leitura)"* — abre o chat sem alterar o status do ticket, mantendo a IA e a fila operando normalmente.
- [x] **Experiência do Modo Espiar**:
  - Banner âmbar no topo do chat com aviso: *"Modo Espiar Ativo: Visualizando conversa em modo somente-leitura sem interferir na IA ou fila"*.
  - Bloqueio do campo de texto com botão de ação rápida *"Atribuir atendimento para mim"* para assumir a qualquer instante.

### 3. 🛠️ Toolbar Superior da Lista de WhatsApp (`frontend/src/app/(dashboard)/inbox`)
- [x] **Barra de Atalhos Integrada**: Adicionados 4 botões de atalho compactos ao lado da barra de busca de contatos:
  - [x] **Agenda de Contatos** (`BookUser`): Modal com busca rápida e lista de contatos para início instantâneo de conversas.
  - [x] **Agendamento de Mensagens** (`CalendarClock`): Modal para programar envio com data, hora e texto.
  - [x] **Menu Rápido (Notas internas / Favoritas)** (`Zap`): Acesso rápido a templates e respostas padrão.
  - [x] **Discador VoIP Flutuante** (`PhoneCall`): Teclado numérico estilo WebRTC SIP no canto da tela (display, teclado 0-9/*/# e botão Chamar).

### 4. 📊 Suíte de Análises & Relatórios (`/dashboard/atendimento`) - Padrão Lero
- [x] **Backend Agregado (`AnalyticsModule`)**:
  - `GET /analytics/overview`: Total, em atendimento, finalizados, receptivos, proativos, novos contatos, TMA, 1ª Resposta e ignorados.
  - `GET /analytics/charts`: Linha temporal agregada por data e distribuições por Status, Setor, Dia da Semana, Operador e Motivo de Finalização.
  - `GET /analytics/agent-performance`: Métricas individuais de operadores com ordenação dinâmica por coluna, badges de status, busca por nome e exportação CSV com BOM UTF-8.
  - `GET /analytics/csat`: Média Geral, Total de Respostas, Promotores e Detratores NPS com distribuição e lista de feedbacks.
  - `GET /analytics/ai-costs`: Auditoria de consumo de tokens OpenAI e custos em USD/BRL.
- [x] **Recursos de Interface**:
  - HoverCards/Tooltips comparativos nos KPIs com variação percentual vs período anterior.
  - Modal "Dias Úteis da Empresa" para configuração de dias operacionais e feriados nacionais.
  - Gráficos Donut de Distribuição por Usuário e por Motivo de Finalização.

### 5. 🎨 Design & Navegação
- [x] **Sidebar Reorganizada**:
  - "Caixa de Atendimento" renomeada para **"WhatsApp"** (`/inbox`) com ícone oficial.
  - "Conexões WhatsApp" movida para o grupo **"SISTEMA / ADMINISTRAÇÃO"** (`/settings/whatsapp`).
- [x] **Cabeçalho de Instância**: Box no topo da lista com nome da linha ("Linha Principal"), dot verde pulsante e botão de atualização de status.
- [x] **Filtros Rápidos**: Pílula `[Não lidas]` com contador numérico em destaque.

### 6. 🚀 Build e Deploy em Produção
- [x] **Frontend Build**: Next.js compilado com sucesso (**0 erros de tipo/linting** e 27 rotas estáticas).
- [x] **Backend Build**: NestJS compilado com sucesso (**0 erros de compilação**).
- [x] **Git / Vercel**: Push efetuado para branch `main` (commit `eee3b9c`), acionando deploy na Vercel.
- [x] **Deploy VPS**: Script `deploy.js` executado via SSH na VPS da Hostinger com restart bem-sucedido do processo PM2 `versus-engine` (**online**).

---

## 🎯 ROTEIRO DE CONTINUAÇÃO PARA SEGUNDA-FEIRA (14/09/2026)

### 🧪 Bateria de Testes de Homologação na Aba WhatsApp (`/inbox`)

#### Cenário 1: Fluxo de Entrada com IA Vitor Online
- [ ] **Envio de Mensagem de Teste**: Disparar mensagem via webhook simulado ou aparelho celular para a linha conectada.
- [ ] **Validação de Fila**: Confirmar que o novo chamado aparece na aba **"Aguardando"** com a tag de IA e `assignedTo = null`.
- [ ] **Resposta da IA**: Verificar se o motor da IA responde automaticamente ao lead no WhatsApp mantendo `bot_active = true`.
- [ ] **Garantia de Isolamento**: Confirmar que o card NÃO figura na aba "Meus" de nenhum operador antes de ser assumido.

#### Cenário 2: Modal de Assunção e Takeover Humano
- [ ] **Abertura do Modal**: Clicar no card na aba "Aguardando" e validar abertura do Modal Central Padrão Lero.
- [ ] **Teste da Ação 1 (Atribuir para mim)**:
  - Clicar no botão verde.
  - Confirmar redirecionamento para a aba "Meus".
  - Verificar se o status mudou para `human_takeover`.
  - Enviar mensagem manual como operador e checar envio pelo WhatsApp.
- [ ] **Teste da Ação 2 (Transferir)**:
  - Clicar em "Transferir atendimento" no modal.
  - Selecionar outro setor (ex: Suporte Técnico).
  - Validar atualização de departamento do ticket.
- [ ] **Teste da Ação 3 (Espiar conversa)**:
  - Clicar em "Espiar conversa".
  - Verificar exibição do Banner Âmbar no topo do chat.
  - Verificar que o campo de digitação fica bloqueado.
  - Clicar no botão "Atribuir atendimento para mim" dentro do modo espiar e confirmar desbloqueio instantâneo do chat.

#### Cenário 3: Ferramentas da Toolbar Superior
- [ ] **Agenda de Contatos**: Abrir modal, buscar contato salvo e clicar em "Conversar" para abrir o chat.
- [ ] **Agendamento de Mensagens**: Preencher data, hora e texto, confirmando o agendamento no sistema.
- [ ] **Menu Rápido (Macros)**: Inserir respostas rápidas no chat com atalho `/` e atalho do botão `Zap`.
- [ ] **Discador VoIP**: Abrir teclado numérico flutuante, digitar número e simular chamada SIP.

#### Cenário 4: Ciclo de Encerramento e Reabertura
- [ ] **Finalizar Atendimento**: Clicar em "Finalizar Atendimento" (status -> `resolved`).
- [ ] **Reabertura por Mensagem do Cliente**: Enviar nova mensagem do mesmo número e confirmar que o chamado reabre na aba "Aguardando" com `status: 'bot_active'`.

---
*Checklist consolidado e pronto para a retomada na segunda-feira pela manhã.*
