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

## 📅 SEGUNDA-FEIRA (14/09/2026) - ENTREGAS DO DIA

### 🟢 Fase 17: Reconstrução do Chat Interno (/chat-interno) - Padrão Lero
- [x] **Estrutura de Abas Superiores**: Seletor no topo da barra lateral entre `[Colaboradores]` (chats 1 a 1) e `[Equipes]` (canais de departamentos), acompanhado do botão de ação rápida `+` para nova conversa ou criação de canal.
- [x] **Barra de Filtros e Busca**: Input reativo "Buscar conversa...", dropdown de filtro por setor/departamento (*Comercial*, *Suporte*, etc.) e pílula de filtro rápido para usuários *Online*.
- [x] **Listagem e Cards de Diálogo**: Cards com avatar e indicador online/offline (dot verde pulsante / cinza), badge do setor, trecho da última mensagem com check de envio, timestamp relativo no padrão Lero (*"4 dias"*, *"21 dias"*, *"14:35"*, etc.) e contador de mensagens não lidas.
- [x] **Painel Central de Mensagens**: Balões de mensagem diferenciados (enviadas pelo usuário à direita em degradê azul e recebidas à esquerda em slate enterprise), cabeçalho detalhado e composer completo (com quebra de linha Shift+Enter e emojis).
- [x] **Backend & WebSocket (NestJS)**: Enriquecimento dos endpoints `/team-chat/users`, `/team-chat/channels` e `/team-chat/departments` trazendo a última mensagem e setor, com entrega em tempo real via Socket.io (`newTeamMessage`).
- [x] **Rotas e Navegação**: Rota oficial `/chat-interno` vinculada na `Sidebar.tsx` e retrocompatibilidade mantida na rota `/team-chat`.

### 🟢 Fase 18: Correção de Cliques e Visões Tabela e Linha do Tempo no CRM (/crm)
- [x] **Correção dos Cliques e Filtros Reativos**:
  * Botões do cabeçalho (`Tudo`, `Minhas`, `Contatos`, `Empresas`) com eventos `onClick` ativos, realizando filtragem reativa instantânea da lista de oportunidades.
  * Seletores de visualização (`Quadro`, `Tabela`, `Linha do Tempo`) integrados em um grupo moderno com ícones (`Kanban`, `Table`, `CalendarDays`) e estado ativo `viewMode: 'kanban' | 'table' | 'timeline'`.
  * Campo de busca reativo conectado com limpeza rápida (`X`), pesquisando por título, contato, telefone, e-mail, notas e responsável.
- [x] **Visão em Tabela Densa**:
  * Tabela moderna agrupando as oportunidades pelos estágios do funil.
  * Cabeçalho colapsável/expansível para cada estágio com indicador de cor, contagem de oportunidades, soma financeira acumulada (`R$`) e atalho para criação de oportunidade.
  * Linhas com dados densos: Título, Contato (avatar e telefone), Descrição/Notas, Responsável (com avatar e nome), Valor formatado em destaque verde (`R$`), Última Interação com horário relativo, Data de Criação e ações rápidas (abertura de conversa WhatsApp e detalhes).
  * Clique na linha abre o `DealModal` para edição completa.
- [x] **Visão em Linha do Tempo (Timeline Semanal)**:
  * Cronograma semanal com seletor e controles de navegação (`<`, `Hoje`, `>`) e formatação dinâmica de intervalo (ex: *13 a 19 de setembro de 2026*).
  * 7 colunas (Domingo a Sábado) com destaque visual e badge "HOJE" no dia atual.
  * Agrupamento automático de cards de oportunidade por data de previsão ou interação (`expectedCloseDate || updatedAt || createdAt`).
  * Cards compactos e elegantes com estágio colorido, título, contato, valor e responsável.
  * Clique no card abre o `DealModal`.
- [x] **Validação & Compilação**:
  * Build do Next.js aprovado com código 0 (sem erros de compilação ou TypeScript).

### 🟢 Fase 19: DealModal Completo e Correção de Cliques no CRM (/crm)
- [x] **Gatilhos de Clique Unificados**:
  * Função `handleOpenDeal(dealId)` implementada e disparada no clique de qualquer card do Quadro Kanban (`DealCard`), linha da tabela (`<tr>`) e card da Linha do Tempo semanal.
  * Preservação de isolamento com `e.stopPropagation()` em ações secundárias (acordeom, botões de cópia e atalhos).
- [x] **Estrutura do DealModal (Padrão Lero)**:
  * **Cabeçalho**: Nome do Lead (com edição inline e salvamento instantâneo), telefone com link direto para WhatsApp, badge da etapa atual com dot de cor oficial e valor do negócio em destaque verde com edição imediata.
  * **Seção "Descrição / Metadados"**: Grid detalhado com respostas estruturadas de formulários Meta Ads (Campanha, Formulário de Captação, Modelo de Interesse, Cidade/UF, E-mail) e bloco de anotações comerciais do atendente com textarea expansível.
  * **Seção "Anexos"**: Upload nativo de arquivos (PDFs, imagens, contratos) com seletor de arquivos, listagem com tamanho formatado, data e botões de download e exclusão.
  * **Seção "Timeline do Card"**: Histórico cronológico de eventos e alterações de estágio (com tags de autor e estágio), acompanhado de campo rápido para registrar novas notas à timeline do negócio.
  * **Painel de Ações Rápidas (Lateral Direita)**:
    - Botão **Reativar Negociação**: Move para etapa ativa (*Em Qualificação*) e limpa motivo de perda com toast de confirmação.
    - Dropdown **Etapa Atual do Funil**: Alteração imediata de estágio sincronizada via API.
    - Dropdown **Responsável pelo Deal**: Carregamento dinâmico de colaboradores da empresa (`/deals/users` e `/users`).
    - Botão **Ver Conversa no WhatsApp**: Redirecionamento direto para o `/inbox?contactId=...` para assumir o chat.
    - Botão **Enviar Mensagem Rápida**: Abertura de drawer integrado para envio de mensagens externas ou anotações privadas.
    - Botões funcionais **Criar Tarefa** e **Criar Evento** com formulários dedicados de agendamento e prazos.
- [x] **Validação & Compilação**:
  * Build Next.js 14 aprovado com código 0 (todas as 28 rotas compiladas sem erros).

### 🟢 Fase 20: Blindagem Anti-Crash do DealModal e Título Interativo na Tabela do CRM
- [x] **Blindagem Anti-Crash e Proteção Null Pointer (DealModal.tsx)**:
  * Optional chaining (`?.`) e fallbacks seguros implementados em todas as propriedades de `deal` (`contact.name`, `contact.phone`, `contact.email`, `contact.source`, `notes`, `customFields`, `timeline`, `metadata`, `assignedTo`).
  * Formatador de datas `safeFormatDate()` blindado com `try/catch` para prevenir exceções do date-fns do tipo `Invalid time value`.
  * Implementação de **Skeleton de Carregamento** corporativo com animação suave de pulso caso o modal seja aberto sem deal carregado ou em transição, evitando crash ou tela branca.
  * Suporte robusto a campos personalizados (`deal.customFields`) e fontes flexíveis de histórico (`deal.timeline` e `metadata.timeline`).
- [x] **Título da Oportunidade Interativo na Tabela (crm/page.tsx)**:
  * Campo "Título da Oportunidade" transformado em link/botão interativo com destaque visual, cor primária ao hover, sublinhado e ícone indicador `ArrowUpRight`.
  * Evento `onClick` explícito disparando `handleOpenDeal(deal)` com `e.stopPropagation()`, garantindo abertura instantânea e segura do `DealModal`.
  * Função `handleOpenDeal` parametrizada para aceitar tanto ID numérico/uuid quanto o próprio objeto `Deal`.
- [x] **Validação & Compilação**:
  * Build do Next.js executado com sucesso (código 0).

### 🟢 Fase 21: Paridade Final da Tabela do CRM com o Lero (/crm)
- [x] **Ordem Exata das 7 Colunas (Lero Strict Alignment)**:
  * 1. **Título**: Link interativo com destaque primário ao hover, sublinhado e ícone `ArrowUpRight` abrindo o `DealModal`.
  * 2. **Contato**: Avatar compacto com inicial, nome do lead e telefone WhatsApp direto (`https://wa.me/...`).
  * 3. **Descrição**: Tag de origem do lead (Meta Ads / Instagram / Site) + notas ou formulário com botão elegante **"Ver mais ⌵ / Ver menos ⌃"** inline.
  * 4. **Responsável**: Avatar circular com inicial + nome do atendente ou badge "Fila Geral".
  * 5. **Valor (R$)**: Formatado rigorosamente em BRL (`R$ XX.XXX,00`) com badge de destaque verde esmeralda.
  * 6. **Última Interação**: Horário relativo formatado no padrão Lero (*"há cerca de 9 horas"*, *"há cerca de 1 hora"*, *"há 45 minutos"*).
  * 7. **Criado Em**: Data de criação formatada (`DD/MM/AAAA`).
- [x] **Compactação e Densidade Corporativa**:
  * Espaçamento vertical de linhas reduzido para `py-2.5 px-3.5`, bordas sutis `divide-gray-800/50` e tipografia `text-xs` de alta densidade para máxima legibilidade.
  * Clique em qualquer ponto da linha (`<tr>`) ou no botão de título acionando imediatamente o `DealModal` blindado.
- [x] **Validação & Compilação**:
  * Build Next.js 14 aprovado com código 0 (todas as 28 rotas compiladas com sucesso).

### Fase 22: Paridade Total da Tabela do CRM com o Lero (Sorting, Filtros Avançados, Seletor de Colunas e Totais Financeiros)
- [x] **Ordenação Interativa nos Cabeçalhos (Sorting)**:
  * Todos os 7 cabeçalhos da tabela (`Título`, `Contato`, `Descrição`, `Responsável`, `Valor`, `Última Interação`, `Criado Em`) clicáveis com hover (`cursor-pointer`) e transição suave.
  * Estados reativos `sortField` e `sortDirection` ('asc' | 'desc') com ícones dinâmicos de ordenação (`ArrowUpDown`, `ArrowUp`, `ArrowDown`).
  * Lógica de ordenação ativa no array de dados tratando com rigor strings, valores numéricos de oportunidade e timestamps de datas.
- [x] **Filtros Avançados & Seletor de Colunas**:
  * Barra de ferramentas superior com input de busca, botão **[Filtros]** com badge dinâmico de filtros ativos (`activeFilterCount`) e menu dropdown de filtragem por estágio ou reset.
  * Botão de engrenagem/seletor **[Colunas]** com popover dropdown interativo de checkboxes para alternar a visibilidade de qualquer uma das 7 colunas em tempo real.
  * Botão de ação rápida `(+)` para criação ágil de nova oportunidade.
- [x] **Somas Financeiras e Contadores por Estágio**:
  * Cabeçalhos expansíveis de estágio do funil com contagem exata de cards (`X cards`) e cálculo automático do montante financeiro total acumulado formatado em BRL (ex: `Total: R$ 44.204,42`) com destaque visual verde esmeralda alinhado à direita.
  * Ajuste dinâmico do `colSpan` conforme o total de colunas visíveis selecionadas.
- [x] **Densidade & Navegação Direta no DealModal**:
  * Ordem estrita mantida: Título | Contato | Descrição | Responsável | Valor (R$) | Última Interação | Criado Em.
  * Expanders inline "Ver mais ⌵ / Ver menos ⌃" para campos longos de descrição.
  * Clique na linha inteira ou no link primário do Título abre imediatamente o `DealModal` blindado.
- [x] **Validação & Compilação**:
  * Build Next.js 14 aprovado com código 0 (todas as 28 rotas compiladas com sucesso em produção).

### Fase 23: Paridade Total da Linha do Tempo / Timeline do CRM (Contadores, Tag Lateral e Filtros Sincronizados)
- [x] **Contadores nos Cabeçalhos dos Dias**:
  * Adicionado badge indicador com a contagem exata de oportunidades no topo de cada coluna de dia (Domingo a Sábado, ex: `1 card`, `2 cards`, `0 cards`).
  * Realce cromático dinâmico para dias com oportunidades e badge de status "Hoje" com data e montante total acumulado por dia em BRL (`R$`).
- [x] **Refinamento Visual dos Cards na Timeline**:
  * Tag lateral sólida vertical com a cor correspondente do estágio do funil (`border-l` / barra lateral dedicada).
  * Badge com nome do estágio no topo com ID `#DEAL`.
  * Título da oportunidade em destaque (`font-bold text-xs text-white group-hover:text-primary`).
  * Informações de contato com ícone e badge de WhatsApp.
  * Rodapé com montante financeiro em verde esmeralda (`formatCurrency`) e avatar do responsável / fila geral.
  * Integração direta com o `DealModal` blindado disparado instantaneamente ao clicar no cartão.
- [x] **Unificação e Sincronização da Barra de Filtros**:
  * Filtros globais (`Tudo`, `Minhas`, `Contatos`, `Empresas`), campo de busca e filtros de estágio sincronizados com a Timeline via `filteredDeals`.
  * Barra de controle de período da timeline com navegação ("Anterior", "Semana Atual", "Próxima"), label da semana e contadores consolidadores (`X cards nesta semana` e `Total: R$ XX.XXX,00`).
- [x] **Validação & Compilação**:
  * Build Next.js 14 aprovado com código 0 (todas as 28 rotas compiladas com sucesso em produção).

### Fase 24: Conversão da Timeline do CRM para o Padrão Linha/Barra Compacta do Lero
- [x] **Substituição dos Cards por Linhas Compactas**:
  * Remoção do layout de cartões verticais volumosos dentro dos dias da semana da timeline.
  * Implementada listagem em formato de linhas limpas, horizontais e minimalistas (estilo calendário corporativo / barras discretas do Lero).
  * Cada evento no dia correspondente exibe uma linha compacta contendo: tag lateral de cor sólida do estágio (`w-1`), dot cromático de identificação rápida, nome do lead em destaque (`text-xs font-bold text-white group-hover:text-primary`), indicador de WhatsApp/contato (`MessageCircle` com badge `WA`) e valor formatado em BRL.
- [x] **Alinhamento à Esquerda da Grade Temporal**:
  * Estrutura de colunas dos 7 dias da semana (Domingo a Sábado) preservada com contadores de volume diário (`X cards`/`X eventos`) e montante financeiro total do dia no topo.
  * Corpo de cada dia preenchido com a lista vertical compacta de eventos/negócios, proporcionando alta densidade e visão panorâmica da agenda comercial.
- [x] **Interação & Modal Blindado**:
  * Clique em qualquer linha compacta de evento na timeline abre instantaneamente o `DealModal` blindado com as informações e metadados completos da oportunidade.
- [x] **Validação & Compilação**:
  * Build Next.js 14 aprovado com código 0 (todas as 28 rotas compiladas com sucesso em produção).

### Fase 25: Agrupamento por Estágios na Linha do Tempo / Timeline do CRM (Padrão Lero)
- [x] **Agrupamento por Estágios do Funil na Lateral Esquerda**:
  * Estruturada listagem vertical da lateral esquerda baseada nos **Estágios do Funil** (`LEADS SEED`, `Novo Contato`, `Em Qualificação`, etc.), com coluna fixa (`sticky left-0`).
  * Cada estágio funciona como um cabeçalho colapsável individual com ícone de expansão `▾/▸`, dot colorido da etapa, contagem de cards (`X cards`) e montante financeiro total acumulado.
  * Botão de expansão/colapso global de todos os estágios simultaneamente no cabeçalho.
- [x] **Distribuição das Barras nas Colunas dos Dias da Semana**:
  * Matriz alinhada com as 7 colunas da semana (Domingo a Sábado), com contadores de cards e totais no cabeçalho superior (`sticky top-0`).
  * Para cada estágio expandido, renderizam-se horizontalmente nas células dos dias da semana as barras compactas de negócios pertencentes àquele estágio e data específica.
  * Cada barra compacta contém: tag lateral de cor sólida do estágio, nome do lead em destaque, indicador de WhatsApp oficial e valor formatado em BRL.
- [x] **Interação Instantânea com o DealModal Blindado**:
  * O clique em qualquer barra compacta de negócio dispara `handleOpenDeal(deal)` abrindo imediatamente o `DealModal` blindado com as informações e metadados completos da oportunidade.
- [x] **Validação & Compilação**:
  * Build Next.js 14 aprovado com código 0 (todas as 28 rotas compiladas com sucesso em produção).





---

## 🕒 Registro de Ponto (Jornada de Desenvolvimento)
- **[08/09/2026 - 08:30]** 🟢 Início da Fundação do Projeto (Docker, Postgres, Supabase, Prisma ORM, BullMQ).
- **[09/09/2026 - 08:30]** 🟢 Implementação de WebSockets, Sentry, Deploy Vercel/VPS e WhatsApp Cloud API.
- **[10/09/2026 - 08:30]** 🟢 Omnichannel Revamp, RAG Avançado, Respostas Rápidas e CRM Lero.
- **[11/09/2026 - 08:15]** 🟢 Início do turno da manhã (Sidebar Enterprise, Conexões WhatsApp, Monitor, Team Chat, Automações e CRM Inline).
- **[11/09/2026 - 13:30]** 🟢 Início do turno da tarde (Analytics Padrão Lero, Fluxo de IA, Modal de Assunção, Toolbar WhatsApp e Deploy).
- **[11/09/2026 - 18:10]** 🏁 Finalização da jornada de sexta-feira com builds 100% aprovados, produção atualizada e checklist definitivo consolidado.
- **[14/09/2026 - 08:15]** 🟢 Início da jornada de desenvolvimento da semana (Foco: Reconstrução do Chat Interno Padrão Lero e Bateria de Testes WhatsApp).

---

## 🚀 Roadmap Futuro (Icebox / Banco de Ideias)
*Esta seção armazena ideias arquiteturais avançadas e expansões de escopo para longo prazo.*

- [ ] **Onboarding Self-Service (Múltiplos Tenants & Sublogins):** Plataforma pública de cadastro. Novas empresas se cadastram via Stripe, geram banco isolado automaticamente, e o ADMIN gerencia "Sublogins" (Atendentes) com permissões limitadas (Apenas tela Inbox e CRM).
- [ ] **Voice AI Agent:** Robô de voz inteligente capaz de realizar ligações ativas (pré-venda/pós-venda) e receber ligações (receptivo) sem delay, integrado à base do CRM e OpenAI (Bland AI / Vapi).
- [ ] **Integração VoIP Nativa (WebRTC):** Permitir que o atendente humano realize chamadas de áudio e vídeo direto pelo navegador na tela de Inbox (Twilio/Vonage), com gravação e transcrição automática vinculada ao card do lead no CRM.
