# Plataforma de Vendas IA - Checklist e Diário de Bordo do Projeto

Este documento rastreia de forma contínua e duradoura todo o histórico de desenvolvimento da Plataforma de Vendas IA. Ele contém desde o primeiro dia de fundação até os próximos passos, servindo como reporte técnico definitivo para os gestores e clientes.

---

## ✅ Fases Concluídas (Histórico do Projeto)

### Fase 1: Fundação e Banco de Dados (08/09/2026 - Manhã)
- [x] Configuração inicial do Supabase e Prisma ORM.
- [x] Modelagem de Dados Multitenant (Tenant, User, Contact, Conversation, Message, Deal, PipelineStage).
- [x] Configuração do ecossistema local Docker (Postgres, Redis, MinIO).
- [x] Sincronização do Prisma ORM (`prisma db push`) finalizada.

### Fase 2: Mensageria e Fila (08/09/2026 - Manhã)
- [x] Implementação do BullMQ e Redis local para gestão de filas assíncronas.
- [x] Criação da arquitetura de Workers e filas independentes para ingestão de mensagens e processamento de IA.

### Fase 3: Gateway de Recepção Inbound (08/09/2026 - Manhã)
- [x] Criação do Endpoint Webhook (`POST /webhooks/meta/:tenantId`).
- [x] Lógica de registro dinâmico de contatos (Contact) e histórico de conversas.
- [x] Ajustes finos no core relacional do Prisma (chaves únicas para `contactId`).

### Fase 4: Inteligência Artificial e Structured Outputs (08/09/2026 - Tarde)
- [x] **[15:45]** Integração com OpenAI API utilizando `Structured Outputs` e Zod (garantia de respostas em formato fixo).
- [x] **[16:25]** Validação de chaves da OpenAI em ambiente de produção real.
- [x] **[16:35]** Validação de sucesso do protocolo de "Transbordo Automático" (Handoff): a IA passou a identificar quando um lead está quente, repassando o controle para o time de vendas humano (marcando `human_takeover`) e pausando as próprias respostas automaticamente.

### Fase 5: API REST do CRM e Livechat (08/09/2026 - Tarde)
- [x] Endpoints protegidos por JWT e Multitenancy Isolado (`@CurrentTenant`).
- [x] Funcionalidades do Chat: `GET /conversations`, `PATCH /takeover`, `PATCH /release`, `POST /messages`.
- [x] Funcionalidades do CRM: `GET /deals` (Painel Kanban com resumos da IA).
- [x] **[16:23]** Implementação de resiliência e failover (`Try/Catch`) no `MessagingService`, permitindo homologação segura no ambiente de desenvolvimento sem derrubar o servidor.

### Fase 6: Front-end PWA e WebSockets (08/09/2026 - Tarde)
- [x] Inicialização Next.js (App Router) + Tailwind CSS com identidade visual "Dark Modern".
- [x] Refatoração de Layout: Separação de rotas com Route Groups (`(dashboard)`).
- [x] Criação da Tela de Login (`/login`) com glow effects.
- [x] Construção da tela de Livechat (`/inbox`) com separação de chats e painel lateral com perfil do lead.
- [x] **[16:45]** Implantação e refatoração do `SocketProvider.tsx` (`socket.io`), conectando a interface à engine de eventos em tempo real do Back-end. Mensagens validadas brotando na tela ao vivo (Fase de testes).

### Fase 7: O Coração da Operação (Integração e Controles do Atendente) (09/09/2026)
- [x] Integração da tela de Inbox para consumo real das mensagens via API. [2026-09-08 14:15]
- [x] Sincronização em Tempo Real (WebSockets) do Chat. [2026-09-08 15:30]
- [x] Persistência do Histórico do Chat ao Recarregar a Página (F5). [2026-09-09 09:20]
- [x] Controles de Transbordo (Handoff): Implementar botão de "Assumir Conversa". [2026-09-09 09:20]
- [x] Notificações Visuais de Novas Mensagens e Transbordo: Efeitos "Pulsar" e alertas no navegador para chamar a atenção imediata do atendente. [2026-09-09 10:15]
- [x] Painel CRM Kanban Dinâmico: Integrar Drag & Drop (`@hello-pangea/dnd`) com a API (`GET /deals` e `PATCH /deals/:id/status`) para exibição e evolução real das negociações qualificadas pela IA. [2026-09-09 09:37]

### Fase 8: Painel de Controle e Deploy Final (09/09/2026)
- [x] Configuração Dinâmica da IA: Conectar a tela do Agente (`/agent`) ao Back-end para salvar alterações no "Prompt Principal" feitas pela interface. [2026-09-09 10:41]
- [x] **Monitoramento e Observabilidade (Sentry):** Integração e encapsulamento global do SDK do Sentry no Front-end (Next.js) e Back-end (NestJS Interceptor) para captura automática e rastreio de erros em tempo real. [2026-09-09 11:55]

### Fase 9: Deploy Oficial e Go-Live (09/09/2026 - Tarde)
- [x] **Configuração do Banco de Dados de Produção:** Setup do Supabase oficial do projeto e migração do Prisma (`prisma db push`). [2026-09-09 13:45]
- [x] **Implantação do Front-end:** Deploy da aplicação Next.js na Vercel com variáveis de ambiente de produção e Proxy Reverso. [2026-09-09 14:10]
- [x] **Implantação do Back-end e Filas:** Deploy da Engine Node.js (NestJS) e Redis na VPS da Hostinger. [2026-09-09 14:15]
- [x] **Integração com WhatsApp Cloud API:** Receber chaves da Meta (Token Permanente e Phone ID) do cliente e refatorar o `MessagingService` para disparar respostas oficiais via Graph API. [2026-09-09 14:45]
- [x] **Go-Live:** Plugar o número oficial de WhatsApp no Webhook da Meta, aprovar Modo Público (Live) e testar integração de ponta a ponta (E2E). [2026-09-09 15:52]

### Fase 10: Refinamento de Operação e RAG (Memória de IA) (09/09/2026 - Final do dia)
- [x] **Lógica de Encerramento (UX):** Botão verde "Finalizar Atendimento" para reiniciar o ciclo da IA após transbordo. [2026-09-09 16:30]
- [x] **Memória de Longo Prazo (RAG):** Injeção dinâmica do histórico do cliente (nome e deals anteriores do CRM) no System Prompt. IA agora reconhece clientes antigos pelo nome e resgata contexto do último atendimento, atuando como um vendedor sênior. [2026-09-09 17:35]

### Fase 11: Integração de Dados Reais (Unmocking) e Go-Live Stability (09/09/2026)
- [x] Login real com JWT e Bcrypt implementado.
- [x] Dashboard dinâmico integrado com `GET /metrics/dashboard` calculando KPI's do PostgreSQL.
- [x] Tela de Contatos consumindo dados reais do banco `GET /contacts`.
- [x] Limpeza de Mocks no Perfil do Cliente (Inbox). [2026-09-09 17:49]
- [x] Tratamento de Erros de UX: Redirecionamento automático (401 Unauthorized) em caso de token expirado nas páginas principais. [2026-09-09 17:53]
- [x] Estabilização de Backend (Bugfix 502 Bad Gateway): Injeção do `AuthModule` no escopo global para resolução de instâncias do `JwtAuthGuard`. [2026-09-09 17:58]

### Fase 12: Unmocking Final e Escalonamento (10/09/2026)
- [x] **Unmocking do Playground (Agent Page):** Remover as mensagens estáticas do componente `Playground` e integrá-lo em tempo real para permitir que o dono da empresa converse com a IA simulando um lead real na tela de configurações. [2026-09-10 09:25]
- [x] **Otimização de Performance (Routing & Cache):** Diagnóstico e resolução de lentidão ao trocar de telas no frontend, com uso de SWR/React Query e Suspense. [2026-09-10 10:15]
- [x] **Integração Base de Conhecimento (RAG Avançado):** Evoluir a memória da IA. Criar uma interface para o cliente fazer upload de PDFs (ex: Tabela de Preços, Catálogos) e processar esses dados em um Vector Database (Pinecone/Supabase pgvector) para a IA ler. [2026-09-10 11:35]
- [x] **Configurações de Respostas Rápidas (UI):** Criar tela administrativa para que gestores possam criar, editar e excluir macros e atalhos (`/`) sem precisar usar o banco de dados. [2026-09-11 08:20]

### Fase 13: Evolução Omnichannel Enterprise (10/09/2026)
- [x] **Etapa 0: Revamp Visual e UX (High Density):** Redesenhar o layout do `/inbox` para adotar a estrutura de 3 colunas (estilo WhatsApp Web Pro), com ícones de status, barra de pesquisa refinada, e Modal expansível no Kanban do CRM. [2026-09-10 18:00]
- [x] **Etapa 1: Triagem e Filas (Departamentos)** [2026-09-11 08:39]
  - Abas na caixa de entrada: "Aguardando" (Fila Geral), "Meus Atendimentos" e "Resolvidos".
  - Botão de "Assumir Conversa" (tira da fila e vincula ao atendente).
  - Encaminhamento interno (Ex: Vendas transfere para Suporte).
- [x] **Etapa 2: Mensageria Avançada:** Suporte a arquivos (upload S3), Notas Internas (Privadas) e Respostas Rápidas (`/`). [2026-09-10 17:30]
- [x] **Etapa 3: CRM 360 Extensível:** Gerenciador de `Tags` coloridas dinâmicas e `Custom Fields` acoplados na barra lateral direita do Chat e no Card do Lead. [2026-09-10 17:40]
- [x] **Etapa 3.5: Redesign CRM Lero:** Evolução do CRM Kanban para padrão Enterprise, com modal rico, alteração de etapa, totais por coluna e atribuição de Responsável. [2026-09-10 18:00]

---

## 📅 SEXTA-FEIRA (11/09/2026) - ENTREGAS DO DIA

### ☀️ Turno da Manhã: Sidebar Enterprise, Módulos Operacionais e Edição no CRM
- [x] **Arquitetura da Sidebar:** Refatoração da navegação para modo expansível (240px/64px) com sub-menus e accordions agrupados por módulo.
- [x] **Modal de Deal Cirúrgico:** Substituição de redirecionamento de páginas por modais de chat internos (`Drawer`).
- [x] **Edição em Tempo Real:** Edição inline de nome, valor (com máscara BRL) e notas do Lead diretamente pelo Kanban.
- [x] **Dropdown de Responsável:** Integração do campo AssignedTo com o tenant (tratamento no Client-side).
- [x] **Conexões WhatsApp (/settings/whatsapp):** Tela de pareamento com QR Code dinâmico, Meta Cloud API, polling/WebSocket de conexão, modo anti-bloqueio e indicador de status verde.
- [x] **Monitor ao Vivo (/monitor):** Grid de atendimentos ativos por setor, cronômetros de tempo de espera/SLA, filtro por operador e sincronização WebSockets.
- [x] **Chat Interno da Equipe (/team-chat):** Schema Prisma (`TeamChannel`, `TeamMessage`), layout dividido e envio em tempo real via SocketProvider.
- [x] **Motor de Automações (/settings/automations):** Tabela de regras `Automation`, tela de blocos de condição (Quando -> Se -> Então) e filas BullMQ para gatilhos temporais.

---

### ⛅ Turno da Tarde: Analytics Padrão Lero, Fluxo de IA, Modal de Assunção e Toolbar WhatsApp

#### 1. 📊 Suíte de Análises & Relatórios Padrão Lero (`/dashboard/atendimento`)
- [x] **Backend Agregado (`AnalyticsModule`)**:
  - `GET /analytics/overview`: Volume total, em atendimento, finalizados, receptivos, proativos, novos contatos, TMA, 1ª Resposta e ignorados.
  - `GET /analytics/charts`: Linha temporal agregada por data (`finished`, `inProgress`, `avgTmaMinutes`) e distribuições por Status, Setor, Dia da Semana, Operador e Motivo de Finalização.
  - `GET /analytics/agent-performance`: Tabela de colaboradores com ordenação dinâmica por coluna, badges de status, campo de busca e exportação CSV UTF-8.
  - `GET /analytics/csat`: Painel de pesquisas de satisfação com 4 KPIs (Média Geral, Total Respostas, Promotores NPS, Detratores), gráficos e lista de feedbacks.
  - `GET /analytics/ai-costs`: Auditoria de consumo de tokens OpenAI e custos em USD/BRL.
- [x] **Recursos de Interface (Paridade Lero)**:
  - HoverCards/Tooltips comparativos nos cards de KPI com variação percentual vs período anterior (+/- %).
  - Modal "Dias Úteis da Empresa" para configuração de dias operacionais e feriados nacionais.
  - Gráficos Donut por Operador e Motivo de Finalização.

#### 2. 🤖 Fluxo de Entrada e Disparo de IA Vitor Online (`backend/src/modules/queues`)
- [x] **Iniciação de Fila Desatendida**: Ao receber mensagem de contato sem chamado aberto, o atendimento é iniciado como `status: 'bot_active'` e `assignedTo: null`.
- [x] **Não-Atribuição Indevida**: Chamados nunca são atribuídos automaticamente ao usuário admin ou operadores logados.
- [x] **Reabertura Automática de Resolvidos**: Mensagens recebidas de leads finalizados reabrem a conversa com `status: 'bot_active'` e `assignedTo: null`.
- [x] **Fila Correta**: Os chamados entram exclusivamente na aba **"Aguardando"** (fila do Bot) e jamais na aba "Meus".
- [x] **Disparo Autônomo da IA**: Motor OpenAI/LangChain responde ativamente enquanto `bot_active = true`.

#### 3. 🛡️ Modal Central de Assunção de Fila / IA (`frontend/src/app/(dashboard)/inbox`)
- [x] **Interceptação de Fila (Padrão Lero)**: Ao clicar em um card que esteja na fila (`waiting`, `bot_active` ou `assignedTo === null`), abre o **Modal Central de Assunção** com backdrop escuro:
  - **Identificação da Fila**: Exibe o nome da fila (*"IA Vitor Online"* ou *"Fila de Espera"*).
  - **Preview do Lead**: Avatar, nome, telefone, badge de status e última mensagem enviada.
  - **Ação 1 (Botão verde principal)**: *"Atribuir atendimento para mim"* — executa takeover via API (`/takeover`), altera status para `human_takeover`, atribui ao operador logado e abre o chat pronto para digitação na aba "Meus".
  - **Ação 2**: *"Transferir atendimento"* — abre o seletor de departamentos para direcionamento de setor.
  - **Ação 3**: *"Espiar conversa (somente leitura)"* — abre o chat sem alterar o status do ticket, mantendo a IA e a fila operando normalmente.
- [x] **Experiência do Modo Espiar**:
  - Banner âmbar no topo do chat com aviso: *"Modo Espiar Ativo: Visualizando conversa em modo somente-leitura sem interferir na IA ou fila"*.
  - Bloqueio do campo de texto com botão de ação rápida *"Atribuir atendimento para mim"* para assumir a qualquer instante.

#### 4. 🛠️ Toolbar Superior da Lista de WhatsApp (`frontend/src/app/(dashboard)/inbox`)
- [x] **Barra de Atalhos Integrada**: Adicionados 4 botões de atalho compactos ao lado da barra de busca de contatos:
  - [x] **Agenda de Contatos** (`BookUser`): Modal com busca rápida e lista de contatos para início instantâneo de conversas.
  - [x] **Agendamento de Mensagens** (`CalendarClock`): Modal para programar envio com data, hora e texto.
  - [x] **Menu Rápido (Notas internas / Favoritas)** (`Zap`): Acesso rápido a templates e respostas padrão.
  - [x] **Discador VoIP Flutuante** (`PhoneCall`): Teclado numérico estilo WebRTC SIP no canto da tela (display, teclado 0-9/*/# e botão Chamar).

#### 5. 🎨 Design & Navegação
- [x] **Sidebar Reorganizada**:
  - "Caixa de Atendimento" renomeada para **"WhatsApp"** (`/inbox`) com ícone oficial.
  - "Conexões WhatsApp" movida para o grupo **"SISTEMA / ADMINISTRAÇÃO"** (`/settings/whatsapp`).
- [x] **Cabeçalho de Instância**: Box no topo da lista com nome da linha ("Linha Principal"), dot verde pulsante e botão de atualização de status.
- [x] **Filtros Rápidos**: Pílula `[Não lidas]` com contador numérico em destaque.

#### 6. 🚀 Build e Deploy em Produção
- [x] **Frontend Build**: Next.js compilado com sucesso (**0 erros de tipo/linting** e 27 rotas estáticas).
- [x] **Backend Build**: NestJS compilado com sucesso (**0 erros de compilação**).
- [x] **Git / Vercel**: Push efetuado para branch `main` (commit `eee3b9c`), acionando deploy na Vercel.
- [x] **Deploy VPS**: Script `deploy.js` executado via SSH na VPS da Hostinger com restart bem-sucedido do processo PM2 `versus-engine` (**online**).

---

## 🎯 ROTEIRO DE CONTINUAÇÃO PARA SEGUNDA-FEIRA (14/09/2026 - MANHÃ)

### 🧪 Bateria de Testes Ponta a Ponta na Aba WhatsApp (`/inbox`)

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

## 🕒 Registro de Ponto (Jornada de Desenvolvimento)
- **[08/09/2026 - 08:30]** 🟢 Início da Fundação do Projeto (Docker, Postgres, Supabase, Prisma ORM, BullMQ).
- **[09/09/2026 - 08:30]** 🟢 Implementação de WebSockets, Sentry, Deploy Vercel/VPS e WhatsApp Cloud API.
- **[10/09/2026 - 08:30]** 🟢 Omnichannel Revamp, RAG Avançado, Respostas Rápidas e CRM Lero.
- **[11/09/2026 - 08:15]** 🟢 Início do turno da manhã (Sidebar Enterprise, Conexões WhatsApp, Monitor, Team Chat, Automações e CRM Inline).
- **[11/09/2026 - 13:30]** 🟢 Início do turno da tarde (Analytics Padrão Lero, Fluxo de IA, Modal de Assunção, Toolbar WhatsApp e Deploy).
- **[11/09/2026 - 18:10]** 🏁 Finalização da jornada de sexta-feira com builds 100% aprovados, produção atualizada e checklist definitivo consolidado.

---

## 🚀 Roadmap Futuro (Icebox / Banco de Ideias)
*Esta seção armazena ideias arquiteturais avançadas e expansões de escopo para longo prazo.*

- [ ] **Onboarding Self-Service (Múltiplos Tenants & Sublogins):** Plataforma pública de cadastro. Novas empresas se cadastram via Stripe, geram banco isolado automaticamente, e o ADMIN gerencia "Sublogins" (Atendentes) com permissões limitadas (Apenas tela Inbox e CRM).
- [ ] **Voice AI Agent:** Robô de voz inteligente capaz de realizar ligações ativas (pré-venda/pós-venda) e receber ligações (receptivo) sem delay, integrado à base do CRM e OpenAI (Bland AI / Vapi).
- [ ] **Integração VoIP Nativa (WebRTC):** Permitir que o atendente humano realize chamadas de áudio e vídeo direto pelo navegador na tela de Inbox (Twilio/Vonage), com gravação e transcrição automática vinculada ao card do lead no CRM.
