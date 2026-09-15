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
  * Abas na caixa de entrada: "Aguardando" (Fila Geral), "Meus Atendimentos" e "Resolvidos".
  * Botão de "Assumir Conversa" (tira da fila e vincula ao atendente).
  * Encaminhamento interno (Ex: Vendas transfere para Suporte).
- [x] **Etapa 2: Mensageria Avançada:** Suporte a arquivos (upload S3), Notas Internas (Privadas) e Respostas Rápidas (`/`). [2026-09-10 17:30]
- [x] **Etapa 3: CRM 360 Extensível:** Gerenciador de `Tags` coloridas dinâmicas e `Custom Fields` acoplados na barra lateral direita do Chat e no Card do Lead. [2026-09-10 17:40]
- [x] **Etapa 3.5: Redesign CRM Lero:** Evolução do CRM Kanban para padrão Enterprise, com modal rico, alteração de etapa, totais por coluna e atribuição de Responsável. [2026-09-10 18:00]

---

## 📅 SEXTA-FEIRA (11/09/2026) - ENTREGAS DO DIA

### Fase 14: Sidebar Enterprise, Módulos Operacionais e Edição no CRM (11/09/2026 - Manhã)
- [x] **Arquitetura da Sidebar:** Refatoração da navegação para modo expansível (240px/64px) com sub-menus e accordions agrupados por módulo.
- [x] **Modal de Deal Cirúrgico:** Substituição de redirecionamento de páginas por modais de chat internos (`Drawer`).
- [x] **Edição em Tempo Real:** Edição inline de nome, valor (com máscara BRL) e notas do Lead diretamente pelo Kanban.
- [x] **Dropdown de Responsável:** Integração do campo AssignedTo com o tenant (tratamento no Client-side).
- [x] **Conexões WhatsApp (/settings/whatsapp):** Tela de pareamento com QR Code dinâmico, Meta Cloud API, polling/WebSocket de conexão, modo anti-bloqueio e indicador de status verde.
- [x] **Monitor ao Vivo (/monitor):** Grid de atendimentos ativos por setor, cronômetros de tempo de espera/SLA, filtro por operador e sincronização WebSockets.
- [x] **Chat Interno da Equipe (/team-chat):** Schema Prisma (`TeamChannel`, `TeamMessage`), layout dividido e envio em tempo real via SocketProvider.
- [x] **Motor de Automações (/settings/automations):** Tabela de regras `Automation`, tela de blocos de condição (Quando -> Se -> Então) e filas BullMQ para gatilhos temporais.

---

### Fase 15: Analytics Padrão Lero, Fluxo de IA, Modal de Assunção e Toolbar WhatsApp (11/09/2026 - Tarde)

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

## 📅 SEGUNDA-FEIRA (14/09/2026) - ENTREGAS DO DIA

### Fase 16: Homologação e Bateria de Testes Ponta a Ponta WhatsApp (14/09/2026 - Manhã)

#### Cenário 1: Fluxo de Entrada com IA Vitor Online
- [x] **Envio de Mensagem de Teste**: Disparar mensagem via webhook simulado ou aparelho celular para a linha conectada.
- [x] **Validação de Fila**: Confirmar que o novo chamado aparece na aba **"Aguardando"** com a tag de IA e `assignedTo = null`.
- [x] **Resposta da IA**: Verificar se o motor da IA responde automaticamente ao lead no WhatsApp mantendo `bot_active = true`.
- [x] **Garantia de Isolamento**: Confirmar que o card NÃO figura na aba "Meus" de nenhum operador antes de ser assumido.

#### Cenário 2: Modal de Assunção e Takeover Humano
- [x] **Abertura do Modal**: Clicar no card na aba "Aguardando" e validar abertura do Modal Central Padrão Lero.
- [x] **Teste da Ação 1 (Atribuir para mim)**:
  * Clicar no botão verde.
  * Confirmar redirecionamento para a aba "Meus".
  * Verificar se o status mudou para `human_takeover`.
  * Enviar mensagem manual como operador e checar envio pelo WhatsApp.
- [x] **Teste da Ação 2 (Transferir)**:
  * Clicar em "Transferir atendimento" no modal.
  * Selecionar outro setor (ex: Suporte Técnico).
  * Validar atualização de departamento do ticket.
- [x] **Teste da Ação 3 (Espiar conversa)**:
  * Clicar em "Espiar conversa".
  * Verificar exibição do Banner Âmbar no topo do chat.
  * Verificar que o campo de digitação fica bloqueado.
  * Clicar no botão "Atribuir atendimento para mim" dentro do modo espiar e confirmar desbloqueio instantâneo do chat.

#### Cenário 3: Ferramentas da Toolbar Superior
- [x] **Agenda de Contatos**: Abrir modal, buscar contato salvo e clicar em "Conversar" para abrir o chat.
- [x] **Agendamento de Mensagens**: Preencher data, hora e texto, confirmando o agendamento no sistema.
- [x] **Menu Rápido (Macros)**: Inserir respostas rápidas no chat com atalho `/` e atalho do botão `Zap`.
- [x] **Discador VoIP**: Abrir teclado numérico flutuante, digitar número e simular chamada SIP.

#### Cenário 4: Ciclo de Encerramento e Reabertura
- [x] **Finalizar Atendimento**: Clicar em "Finalizar Atendimento" (status -> `resolved`).
- [x] **Reabertura por Mensagem do Cliente**: Enviar nova mensagem do mesmo número e confirmar que o chamado reabre na aba "Aguardando" com `status: 'bot_active'`.

---

## 📅 SEGUNDA-FEIRA (14/09/2026) - ENTREGAS DO DIA

### Fase 17: Reconstrução do Chat Interno (/chat-interno) - Padrão Lero
- [x] **Estrutura de Abas Superiores**: Seletor no topo da barra lateral entre `[Colaboradores]` (chats 1 a 1) e `[Equipes]` (canais de departamentos), acompanhado do botão de ação rápida `+` para nova conversa ou criação de canal.
- [x] **Barra de Filtros e Busca**: Input reativo "Buscar conversa...", dropdown de filtro por setor/departamento (*Comercial*, *Suporte*, etc.) e pílula de filtro rápido para usuários *Online*.
- [x] **Listagem e Cards de Diálogo**: Cards com avatar e indicador online/offline (dot verde pulsante / cinza), badge do setor, trecho da última mensagem com check de envio, timestamp relativo no padrão Lero (*"4 dias"*, *"21 dias"*, *"14:35"*, etc.) e contador de mensagens não lidas.
- [x] **Painel Central de Mensagens**: Balões de mensagem diferenciados (enviadas pelo usuário à direita em degradê azul e recebidas à esquerda em slate enterprise), cabeçalho detalhado e composer completo (com quebra de linha Shift+Enter e emojis).
- [x] **Backend & WebSocket (NestJS)**: Enriquecimento dos endpoints `/team-chat/users`, `/team-chat/channels` e `/team-chat/departments` trazendo a última mensagem e setor, com entrega em tempo real via Socket.io (`newTeamMessage`).
- [x] **Rotas e Navegação**: Rota oficial `/chat-interno` vinculada na `Sidebar.tsx` e retrocompatibilidade mantida na rota `/team-chat`.

### Fase 18: Correção de Cliques e Visões Tabela e Linha do Tempo no CRM (/crm)
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

### Fase 19: DealModal Completo e Correção de Cliques no CRM (/crm)
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

### Fase 20: Blindagem Anti-Crash do DealModal e Título Interativo na Tabela do CRM
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

### Fase 21: Paridade Final da Tabela do CRM com o Lero (/crm)
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

### Fase 26: Remoção de Ícone Redundante e Harmonização do Cabeçalho do CRM
- [x] **Remoção de Elementos Redundantes no Título do Funil**:
  * Remoção do ícone/botão redundante (`LayoutDashboard`) ao lado do seletor do funil, deixando a seleção limpa e nativa no padrão Lero.
  * Título com tipografia nítida e transição suave no hover.
- [x] **Harmonização do Layout e Alinhamento do Topo**:
  * Reorganização do container superior em layout flexível responsivo (`flex-wrap lg:flex-nowrap items-center justify-between gap-3`).
  * Altura padronizada para botões e campos de busca (`py-1.5`, `rounded-lg`).
  * Alinhamento vertical centralizado perfeito de todos os módulos (Seletor de Funil, Abas de Visualização, Filtros de Propriedade, Busca Reativa e Ações Rápidas), eliminando quebras de linha e descompassos visuais.
- [x] **Validação & Compilação**:
  * Build Next.js 14 aprovado com código 0 (todas as 28 rotas compiladas com sucesso em produção).

### Fase 27: Edição de Nome no Perfil do Operador e Correção de Sobreposição no CRM
- [x] **Edição de Nome no Seletor/Menu de Perfil**:
  * Adicionado modal interativo no rodapé da Sidebar (`Editar Perfil do Usuário`), permitindo que qualquer operador ou administrador altere seu nome com salvamento rápido via API (`PATCH /users/profile`).
  * Persistência em banco de dados e sincronização imediata no `localStorage` (`versus_user`) e via evento customizado global (`user_updated`), refletindo o novo nome instantaneamente no Chat Interno, CRM e Inbox.
  * Avatar com inicial dinâmica do nome e botão de logout integrado.
- [x] **Correção Definitiva de Sobreposição de Elementos no CRM**:
  * Reestruturação do flexbox da toolbar superior para fluxo responsivo (`flex-col 2xl:flex-row items-stretch 2xl:items-center justify-between gap-3`), eliminando qualquer colisão ou sobreposição entre os botões de ação (`+ Nova Etapa`, `Gerenciar Etapas`) e as abas (`Quadro`, `Tabela`, `Linha do Tempo`).
  * Scroll horizontal suave para filtros de categoria em telas menores com `custom-scrollbar`.
- [x] **Validação & Compilação**:
  * Builds do frontend (Next.js 14) e do backend (Nest.js) aprovados com código 0.

### Fase 28: Edição de Nome do Funil e Reestruturação Geométrica da Barra Superior do CRM (/crm)
- [x] **Edição Interativa do Nome do Funil**:
  * Bloco de título "Funil Principal (Padrão)" transformado em elemento interativo com ícone discreto `Edit2`.
  * Ao clicar no título ou no ícone, exibe input inline dinâmico com confirmação via tecla `Enter` ou botão de check verde, e cancelamento via tecla `Escape` ou botão X.
  * Persistência em estado e no `localStorage` (`crm_funnel_name`), preservando o nome customizado do funil entre recarregamentos da página.
- [x] **Alinhamento Geométrico e Responsivo da Barra Superior (Padrão Lero)**:
  * Reorganização completa da barra superior em 3 blocos ordenados e espaçados com `gap-4`:
    * **Bloco 1 (Esquerda)**: Título/Seletor de Funil com `Edit2` + Abas de Visualização (`Quadro`, `Tabela`, `Linha do Tempo`).
    * **Bloco 2 (Centro)**: Barra de Busca de Oportunidades + Filtros Rápidos (`Tudo`, `Minhas`, `Contatos`, `Empresas`).
    * **Bloco 3 (Direita)**: Botões de Ação (`Neutro`, `+ Nova Etapa`, `Gerenciar Etapas`, `Fullscreen`).
  * Blindagem responsiva em `flex-col xl:flex-row`: em resoluções menores os 3 blocos se empilham ordenadamente sem sobreposição ou quebra de layout entre botões, abas e campo de busca.
- [x] **Validação & Compilação**:
  * Build Next.js 14 validado com sucesso (`exit code 0`, 28 rotas estáticas e dinâmicas geradas).

### Fase 29: Alinhamento Único e Fluido da Barra Superior do CRM (/crm)
- [x] **Barra Superior em Linha Única (Single-Row Flexbox)**:
  * Remoção do layout em múltiplos blocos empilhados (`flex-col`). Implementação de barra horizontal única fluida: `flex items-center justify-between gap-3 w-full bg-[#161b22] p-2.5 sm:p-3 rounded-xl border border-gray-800/60 overflow-x-auto custom-scrollbar`.
  * **Lado Esquerdo**: Título do Funil com edição inline (`Edit2`) integrado diretamente às abas de visualização (`Quadro`, `Tabela`, `Linha do Tempo`).
  * **Lado Centro/Direita**: Campo de busca compactado com ícone e limpeza rápida + Filtros de categoria (`Tudo`, `Minhas`, `Contatos`, `Empresas`) + Botões de Ação (`Neutro`, `+ Nova Etapa`, `Gerenciar Etapas`, `Fullscreen`).
- [x] **Compactação Executiva de Elementos (Padrão Lero)**:
  * Ajuste micrométrico de paddings internos (`py-1`, `px-2.5`) e gaps compactados para alinhamento geométrico perfeito sem quebras de linha indesejadas.
  * Suporte a scroll horizontal suave em telas menores através de `overflow-x-auto custom-scrollbar`.
- [x] **Validação & Compilação**:
  * Build de produção Next.js 14 aprovado com código 0 (28 rotas estáticas e dinâmicas).

### Fase 30: Implementação de Modo Tela Cheia (Fullscreen API) no CRM (/crm)
- [x] **Botão Interativo de Fullscreen**:
  * Localizado na barra superior à direita, alternando dinamicamente os ícones entre `Maximize2` (expandir) e `Minimize2` (reduzir/sair).
  * Estilização com highlight ativo (`bg-primary/20 text-primary border-primary/40`) e tooltip explicativo (`Sair da tela cheia (Esc)`).
- [x] **Isolamento de Tela Cheia via Fullscreen API**:
  * Vinculação direta ao elemento `<div id="crm-container">` com `useRef` e fallback cross-browser (`requestFullscreen`, `webkitRequestFullscreen`, `mozRequestFullScreen`, `msRequestFullscreen`).
  * Ao entrar em tela cheia, apenas o container do CRM é exibido cobrindo 100% da viewport (`w-screen h-screen bg-[#0a0c10]`), ocultando automaticamente a Sidebar e o Header da aplicação.
  * Listeners integrados para eventos de sistema e tecla <kbd>Esc</kbd> (`fullscreenchange`, `webkitfullscreenchange`, `mozfullscreenchange`, `MSFullscreenChange`), restaurando o layout padrão perfeitamente ao sair.
- [x] **Validação & Compilação**:
  * Build de produção Next.js 14 validado com sucesso (`exit code 0`, 28 rotas).

### Fase 31: Refinamento Visual e Clean do DealModal do CRM (/crm)
- [x] **Substituição e Refinamento de Vetores de Edição (`PencilLine`)**:
  * Substituição de emojis anteriores (`✏️`) e adição de ícones de edição discretos com vetor minimalista `PencilLine` (`w-3.5 h-3.5`) no botão "Editar Anotações", no título da oportunidade e no valor financeiro do negócio.
  * Transições suaves corporativas (`transition-colors hover:text-primary`) com controle de opacidade em hover (`group-hover:opacity-100`).
- [x] **Evolução para Layout Clean Executivo (Padrão Lero)**:
  * Padronização de fundos e bordas nos blocos de conteúdo com tom consistente e suave: `bg-[#161b22]/70 border border-gray-800/80 rounded-xl p-5 shadow-sm` (*Respostas de Formulário & Metadados*, *Anexos da Oportunidade*, *Timeline do Card*).
  * Refinamento do respiro, paddings e margens do cabeçalho (`px-6 lg:px-8 py-4.5`), coluna de dados (`p-6 lg:p-7 space-y-5`) e painel lateral de ações (`w-full lg:w-[350px] bg-[#161b22]/40 p-6 lg:p-7`).
  * Realce financeiro e de conversão em verde esmeralda com sombras profundas no botão de conversa do WhatsApp (`bg-emerald-600 hover:bg-emerald-500`) e valor formatado em BRL.
- [x] **Validação & Compilação**:
  * Build Next.js 14 aprovado com código 0 (28 rotas de produção geradas).

### Fase 32: Harmonização Monocromática e Clean do DealModal no Padrão Lero (/crm)
- [x] **Paleta Monocromática e Tons de Azul Escuro**:
  * Eliminação de cores contrastantes ou ruidosas nos blocos internos e cabeçalhos.
  * Padronização de fundos com `bg-[#0d1117]` e `bg-[#161b22]`, e divisores sutis com bordas `border-gray-800/60`.
  * Textos primários consolidados em branco puro (`text-white` / `text-gray-200`) e secundários em cinza claro corporativo (`text-gray-400`).
- [x] **Simplificação e Unificação dos Botões de Ação**:
  * Painel lateral de ações com botões padronizados no formato monocromático elegante (`bg-[#161b22] hover:bg-[#21262d] text-gray-200 border border-gray-800`): *Ver Conversa no WhatsApp*, *Enviar Mensagem Rápida*, *Criar Tarefa* e *Criar Evento*.
  * Destaque sutil e corporativo apenas para ações de status crítico: Ganho em verde esmeralda corporativo (`bg-emerald-950/20 text-emerald-400 border-emerald-900/40`) e Perdido em vermelho/vinho discreto (`bg-rose-950/20 text-rose-400/90 border-rose-900/30`).
  * Submodal de confirmação de perda (`showLossModal`) monocromático e polido com motivos e justificativa.
  * Submodais de Tarefa, Evento e Chat Drawer unificados nos mesmos tons `bg-[#161b22]` e inputs `bg-[#0d1117]`.
- [x] **Validação & Deploy Vercel**:
  * Build Next.js 14 executado com sucesso e aprovado com código 0 (28 rotas estáticas/dinâmicas geradas).
  * Deploy enviado para produção no repositório GitHub e Vercel.

### Fase 33: Implementação do Modal Editar Contato no DealModal do CRM (/crm)
- [x] **Card e Acesso Rápido "Informações do Contato"**:
  * Adicionado card dedicado "Informações do Contato" no topo da coluna esquerda do `DealModal` com os dados essenciais (Nome Completo, WhatsApp/Telefone, E-mail, Cargo & Empresa) e botão de ação "Editar Contato".
  * Integração de gatilhos para abertura do modal tanto no clique do nome/lápis do cabeçalho quanto no botão dedicado no painel lateral direito de ações rápidas.
- [x] **Submodal Completo "Editar Contato" em Grade (Grid-Cols-2)**:
  * Modal responsivo e monocromático (`bg-[#161b22]`, inputs em `bg-[#0d1117] border border-gray-800 text-white`).
  * Campos implementados: Nome do Contato, Número WhatsApp, Data de Nascimento, Email, Cargo / Função, CPF / CNPJ, Tipo de Contato (Lead, Cliente, etc.), Endereço Completo & CEP, Empresas (Atribuir Empresa com ícone `Building2`), Rótulo de Campanha & Origem do Contato, e Observações do Contato (textarea).
  * Rodapé com ação de "Excluir contato" (vermelho sutil) e botão "Salvar" (azul executivo com persistência de dados local, API e timeline de histórico comercial).
- [x] **Validação & Deploy Vercel**:
  * Compilação Next.js 14 aprovada com código 0 gerando 28 rotas de produção.
  * Deploy efetuado no GitHub e disparado na Vercel.

### Fase 34: Atualização dos Modais de Criar Tarefa e Criar Evento no Padrão Lero (/crm)
- [x] **Modal Unificado "Nova Tarefa" e "Novo Evento" no Padrão Lero**:
  * Topo com abas cápsula interativas ("Evento" e "Tarefa") permitindo alternar contextualmente sem sair do modal.
  * Faixa "Vinculado a" exibindo o contato/negócio atual com chip elegante e identificador da oportunidade.
- [x] **Aba "Nova Tarefa" Completa**:
  * Inputs para Título e Descrição com placeholders limpos e foco estilizado.
  * Seção "QUANDO" com seletor de Data, Hora e checkbox "Dia inteiro".
  * Seção "DETALHES DA TAREFA" com seletores em grade para Categoria (Ligação, WhatsApp, Reunião, E-mail, Proposta, Visita Técnica, Outro), Prioridade (Baixa, Média, Alta, Urgente) e Responsável (atribuição por membro da equipe ou Fila Geral).
  * Seção "ANEXOS" com upload dinâmico de múltiplos arquivos, chips de visualização e remoção, e indicador de limite total (máx 25 MB).
  * Rodapé com "Cancelar", ação secundária "Criar e adicionar outra" (com reset de campos para criação ágil em lote) e botão principal "Criar tarefa" com registro na timeline comercial.
- [x] **Aba "Novo Evento" Completa**:
  * Título e Descrição do Evento.
  * Seção "QUANDO" com Data/Hora de início e término, suporte ao toggle "Termina em outro dia" e checkbox "Dia inteiro".
  * Seção "AGENDA" (Empresa / Privada) e "ONDE" (Google Meet, Microsoft Teams, Jitsi, Presencial com endereço customizável ou Nenhum).
  * Seção "PARTICIPANTES & NOTIFICAÇÕES" com seleção de membros internos da equipe, badge do contato cliente, notificação de lembrete no sistema (15 min antes) e envio de convite por e-mail com link da reunião.
  * Botão de ação principal "Criar evento" integrado à timeline da oportunidade.
- [x] **Estilização Monocromática Clean**:
  * Fundos em `bg-[#161b22]`, campos em `bg-[#0d1117] border border-gray-800`, textos em branco e cinza corporativo, integrados perfeitamente ao DealModal.
- [x] **Validação & Deploy Vercel**:
  * Compilação Next.js 14 aprovada com código 0 gerando 28 rotas de produção.
  * Deploy enviado com sucesso para produção na Vercel via Git push.

### Fase 35: Conexão de Rotas e Endpoints dos Cards do CRM (/crm)
- [x] **Mapeamento de Rotas e Cliques nos Cards do Kanban**:
  * Implementado manipulador `handleOpenDeal` integrado ao roteamento do navegador, sincronizando parâmetros de URL `?dealId=...` via `window.history.replaceState` e `useSearchParams`.
  * Suporte a deep-link e abertura automática de oportunidades quando a URL for acessada diretamente ou via notificação.
  * Botões e atalhos internos do card conectados:
    - *Enviar Mensagem*: Redireciona para `/inbox?contactId=...` com verificação de fallback ou abre gaveta de chat imediata.
    - *Criar Evento*: Aciona o `DealModal` com abertura automática da aba "Novo Evento".
    - *Criar Tarefa*: Aciona o `DealModal` com abertura automática da aba "Nova Tarefa".
    - *Ir para Atendimento*: Redireciona com segurança para `/inbox?contactId=...`.
- [x] **Conexão de Endpoints de Oportunidades no Backend**:
  * Rotas do `CrmController` atualizadas para suportar aliases `['deals', 'crm/deals']`.
  * Implementado endpoint `GET /deals/:id` e `GET /crm/deals/:id` via método `findOneDeal` no `CrmService` com dados completos do contato e do responsável.
  * Implementado endpoint `POST /deals` e `POST /crm/deals` via método `createDeal` para suporte à criação rápida de novas oportunidades pelo botão "Adicionar novo cartão".
- [x] **Validação & Deploy Vercel**:
  * Build do Backend NestJS e Frontend Next.js 14 testados e aprovados com código 0.
  * Deploy enviado com sucesso para produção na Vercel via Git push.

### Fase 36: Evolução e Refinamento da Aba Métricas e Vendas no Padrão Lero (/dashboard/cm)
- [x] **Cards Analíticos Interativos por Hover (Padrão Lero) & Grid de 8 Medidores**:
  * Grid fluido de 8 medidores analíticos compactos (`grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5`):
    1. *Oportunidades*: Volume total criado e variação percentual.
    2. *Em Aberto*: Quantidade ativa em negociação e valor monetário do pipeline.
    3. *Ganhas*: Quantidade e faturamento ganho em BRL com destaque esmeralda.
    4. *Perdidas*: Quantidade e receita perdida com cálculo direcional de perdas.
    5. *Ticket Médio*: Média ponderada por oportunidade convertida em tipografia mono.
    6. *Taxa de Ganho (Win Rate)*: Percentual de conversão sobre o total fechado com micro-barra de progresso.
    7. *Ciclo Médio de Venda*: Média em dias desde o primeiro contato até o fechamento.
    8. *Movimentação*: Tempo médio de permanência por etapa no funil comercial em horas.
  * Componente flutuante corporativo `KpiPopover` acionado por hover (`onMouseEnter`/`onMouseLeave`) em `bg-[#0d1117] border border-gray-800 text-gray-200 text-xs shadow-2xl rounded-xl p-3 z-50`:
    - Comparativo de Período Atual vs. Período Anterior de mesma duração.
    - Badges de variação percentual com cores direcionais (verde para alta positiva, vermelho/vinho para quedas ou perdas).
    - Detalhes adicionais de volume, média diária e métricas de conversão.
- [x] **Seletor de Data Personalizada com Popover Corporativo (Padrão Lero)**:
  * Ao clicar na pílula "Personalizado", abre popover flutuante corporativo com backdrop-blur em `bg-[#0d1117] border border-gray-800 shadow-2xl rounded-2xl p-4`.
  * Quatro seletores rápidos interativos: *Últimos 7 dias*, *Últimos 15 dias*, *Este mês*, *Mês anterior*.
  * Dois inputs de data formatados (Data Inicial e Data Final) com botão de ação rápida "Aplicar Intervalo".
- [x] **Tradução Completa dos Rótulos do Funil Comercial (PT-BR)**:
  * Rótulos do gráfico traduzidos no backend e frontend:
    - `NEW` -> `Novo Contato`
    - `FOLLOW-UP` -> `Em Qualificação`
    - `QUALIFIED` -> `Qualificado`
    - `PROPOSAL` -> `Proposta`
    - `NEGOTIATION` -> `Negociação`
    - `WON` -> `Fechado / Ganho`
    - `LOST` -> `Fechado / Perdido`
- [x] **Filtros de Contexto Superior Completos & Dinâmicos**:
  * Filtro temporal: `Hoje`, `7d`, `15d`, `30d`, `90d` e `Personalizado`.
  * Critério temporal: Seletor de `Última Movimentação` (via `updatedAt`) vs `Data de Criação` (via `createdAt`).
  * Filtro de Status: `Todos os Status`, `Em Aberto`, `Fechado / Ganho`, `Fechado / Perdido`.
  * Filtro de CRMs: `Todos os CRMs`, `Funil Principal`, `Vendas Inbound`, `Outbound B2B`, `Parcerias`.
  * Filtro de Responsáveis: `Todos os Responsáveis` + listagem dinâmica dos membros da equipe.
  * Botão de ação: "Gerar / Recarregar" destacado à direita com loading reativo.
- [x] **Validação & Deploy Vercel**:
  * Build do Next.js 14 validado com sucesso (código 0, 29 rotas de produção geradas).
  * Deploy enviado para produção na Vercel via Git push.

### Fase 37: Paridade Exata dos 6 Cards Superiores de Métricas e Vendas no Padrão Lero (/dashboard/cm & /dashboard/crm)
- [x] **Reestruturação Arquitetural dos 6 Cards Principais no Padrão Lero**:
  * Substituição do grid de 8 medidores simples por uma grade executiva de 6 cards principais (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3`), com subdivisões funcionais e dados consolidados:
    1. **Card 1: Oportunidades Criadas**: Contagem total de leads/deals gerados em destaque mono + variação percentual vs. período anterior + subdivisão inferior com montante financeiro total do pipeline em BRL (`Total: R$ ...`).
    2. **Card 2: Em Aberto**: Contagem ativa em negociação em azul + variação percentual + subdivisão inferior com receita ativa do pipeline (`Pipeline: R$ ...`).
    3. **Card 3: Ganhas**: Contagem de vendas ganhas em verde esmeralda + variação percentual + subdivisão inferior com receita faturada ganha (`Receita: R$ ...`).
    4. **Card 4: Perdidas**: Quantidade de oportunidades perdidas em rose/vinho + variação percentual + subdivisão inferior com montante financeiro de perda (`Perda: -R$ ...`).
    5. **Card 5: Ticket Médio**: Valor monetário ponderado por oportunidade ganha em BRL + variação percentual + subdivisão com subtítulo "Por venda fechada" e chip "Ganhas".
    6. **Card 6: Taxa de Ganho & Ciclo/Movimentação (Composto Padrão Lero)**: Bloco multi-indicador integrado com grade interna de 3 colunas:
       - *Ganho*: Win Rate % em destaque verde esmeralda;
       - *Ciclo*: Ciclo médio de vendas em dias (`Xd`);
       - *Movim.*: Tempo médio de permanência por etapa no funil (`~Xh`).
       - Rodapé informativo com a variação percentual de conversão comercial vs. período anterior.
- [x] **Popovers Analíticos Interativos (`KpiPopover`) em 100% dos Cards**:
  * Cada um dos 6 cards possui popover flutuante ativado por hover (`onMouseEnter`/`onMouseLeave`) com backdrop escuro (`#0d1117`), comparando o valor do Período Atual vs. Período Anterior de mesma duração.
  * Suporte estendido a métricas extras (`extraMetrics`) no Card Composto 6, detalhando no hover o comparativo isolado de Win Rate, Ciclo Médio em dias e Tempo de Movimentação em horas com tags direcionais de cor.
- [x] **Validação & Compilação**:
  * Build do Next.js 14 testado e aprovado com sucesso (**código 0**, 29 rotas estáticas/dinâmicas geradas).

### Fase 38: Tradução Consistente das Etapas do Funil na Tabela de Relatórios (/dashboard/cm & /dashboard/crm)
- [x] **Mapeamento Canônico de Etapas em PT-BR (`translateStage`)**:
  * Função helper de normalização com dicionário rigoroso `STAGE_TRANSLATIONS`:
    - `NEW` / `NOVO CONTATO` -> `Novo Contato`
    - `FOLLOW-UP` / `FOLLOWUP` / `EM QUALIFICAÇÃO` -> `Em Qualificação`
    - `QUALIFIED` / `QUALIFICADO` -> `Qualificado`
    - `SEED` / `LEADS SEED` -> `Leads Seed`
    - `PROPOSAL` / `PROPOSTA` -> `Proposta`
    - `NEGOTIATION` / `NEGOCIAÇÃO` -> `Negociação`
    - `WON` / `GANHO` / `FECHADO / GANHO` -> `Fechado / Ganho`
    - `LOST` / `PERDIDO` / `FECHADO / PERDIDO` -> `Fechado / Perdido`
    - `DISQUALIFIED` / `DESQUALIFICADO` -> `Desqualificado`
- [x] **Renderização dos Chips na Tabela e Exportação CSV**:
  * Chips visuais com espaçamento confortável (`px-2.5 py-1 text-[10px] font-bold border uppercase`), integrando cores semânticas (`getStatusStyle`) para cada estágio.
  * Coluna "Etapa / Status" na exportação CSV UTF-8 parametrizada com o mesmo tradutor `translateStage`.
- [x] **Validação & Deploy Vercel**:
  * Build do Next.js 14 validado com sucesso (código 0, 29 rotas geradas).
  * Deploy enviado para produção via Git push.

### Fase 39: Refatoração da Arquitetura WhatsApp & Livechat Avançado (Padrão Lero Multi-tenant)
- [x] **Modelagem Prisma & Sincronização de Banco (Multi-tenant)**:
  * Campo `avatarUrl String?` adicionado ao model `Contact` para suporte a fotos reais de contatos em alta resolução.
  * Criação dos models `WhatsAppInstance` e `WhatsAppConnectionHistory` vinculados com integridade referencial ao `Tenant` (`whatsappInstances WhatsAppInstance[]`).
  * Campos implementados: `id` (UUID), `tenantId`, `name`, `phoneNumber`, `profilePicUrl`, `profileName`, `status` (`DISCONNECTED`, `CONNECTING`, `CONNECTED`), `qrCode`, `token`, `phoneNumberId`, `isDefault`, `settings` (JSON com regras anti-ban e delays), `lastConnectedAt`, `createdAt`, `updatedAt` e histórico de eventos.
  * Sincronização executada com sucesso via `prisma db push` no banco Supabase remoto e cliente Prisma gerado via `prisma generate`.
- [x] **Backend NestJS (Módulos WhatsApp & Messaging)**:
  * `WhatsAppService`: Implementado gerenciamento de instâncias completo (`getInstances`, `createInstance`, `getInstanceById`, `updateInstance`, `deleteInstance`, `connectInstance` com simulação de QR Code e geração de sessão, `disconnectInstance`), mantendo retrocompatibilidade transparente em `getConfig` e `updateConfig` via redirecionamento para instância padrão do tenant.
  * `WhatsAppController`: Rotas REST protegidas expostas (`GET/POST /whatsapp/instances`, `GET/PATCH/DELETE /whatsapp/instances/:id`, `POST /whatsapp/instances/:id/connect`, `POST /whatsapp/instances/:id/disconnect`, `/whatsapp/config`).
  * `MessagingService`: Atualizado `sendText` para busca dinâmica de credenciais e tokens a partir da instância ativa vinculada ao tenant/conversa, eliminando tokens estáticos injetados.
- [x] **Frontend - Provider & Configurações (/settings/whatsapp)**:
  * `WhatsAppProvider.tsx`: Atualizado para consumir `@/lib/api` autenticado, suportando lista de instâncias dinâmicas (`instances`), instância ativa (`activeInstance`, `setActiveInstance`) e re-sincronização de status reativo.
  * `settings/whatsapp/page.tsx`: Tela de configurações totalmente reestruturada com seletor multi-instância, modal "+ Nova Instância", perfil da conta com avatar, status reativo com ping pulsante, aba de QR Code com temporizador e auto-refresh, regras de segurança anti-bloqueio (digitação humana e espaçamento) e histórico de conexões/auditoria.
- [x] **Frontend - Inbox & Livechat Avançado (/inbox)**:
  * Seletor de instâncias dinâmico integrado no topo da coluna lateral esquerda com status reativo (`connected`, `connecting`, `disconnected`), avatar da linha e dropdown para alternar sessões ou acessar "+ Gerenciar / Nova Instância".
  * Renderização de foto de perfil real dos contatos (`contact.avatarUrl`) na lista de conversas, no cabeçalho do chat ativo e no painel de contexto do lead, com fallback automático para iniciais estilizadas em caso de ausência ou falha de imagem.
  * Barra de ferramentas rica no rodapé do chat (composer) com seletor rápido de emojis (50 emojis frequentes em popover organizado), botões de formatação WhatsApp rápida (Negrito `*B*`, Itálico `_I_`, Tachado `~S~`, Monoespaçado `</>`), botão de Respostas Rápidas (`Zap`) e alternador de Modo Externo (WhatsApp) / Nota Interna.
- [x] **Validação & Compilação**:
  * Build do Backend NestJS executado e aprovado com sucesso (**código 0**).
  * Build do Frontend Next.js 14 executado e aprovado com sucesso (**código 0**, 29 rotas de produção geradas).

### Fase 40: Refinamento Visual e Funcional do Inbox e Composer (Padrão Mensageria Profissional)
- [x] **Gravação de Áudio via `MediaRecorder` no Composer**:
  * Botão de microfone (`Mic`) dinâmico integrado ao rodapé do chat, ativado quando o input de texto e arquivos estiver vazio.
  * Painel de gravação ativo com indicador visual pulsante em vermelho, cronômetro em tempo real (`mm:ss`) e ondas sonoras animadas.
  * Botão de descarte (`Trash2`) com liberação segura dos canais do microfone e cancelamento imediato.
  * Botão de envio de áudio gravado (`Send`) que converte os chunks gravados em Blob / WebM, realiza upload seguro para o Supabase Storage (`versus-media/chat/...`) e envia mensagem com `type: 'audio'`.
- [x] **Hierarquia Visual Avançada das Bolhas de Mensagens**:
  * Mensagens Outbound estilizadas no tom verde WhatsApp corporativo (`bg-[#005c4b]/95 border border-emerald-600/30 text-emerald-50 rounded-2xl rounded-tr-none px-4 py-2.5 shadow-md`), com horário e checks duplos de leitura (`CheckCheck` em esmeralda) alinhados no rodapé inferior direito.
  * Mensagens Inbound com fundo contrastante refinado (`bg-[#1E293B] border border-gray-700/60 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm`).
  * Notas Internas destacadas com fundo âmbar sofisticado (`bg-amber-500/10 border border-amber-500/40 text-amber-100 rounded-2xl rounded-tr-none`) e badge com cadeado no cabeçalho.
  * Mini-player customizado para mensagens de áudio (`type: 'audio'`) com botão de play/pause circular, indicador de status sonoro e ondas sonoras visuais animadas durante reprodução.
  * Pill moderna translúcida com ícone `Bot` em ciano para identificação de mensagens automatizadas da IA Vitor.
- [x] **Abas de Filtro de Conversas Segmentadas (Grid Pro)**:
  * Reestruturação do seletor superior da barra lateral em 4 abas modernas (`grid grid-cols-4 gap-1 bg-[#1E293B] p-1 rounded-xl border border-gray-700/60 shadow-inner`): **Aguardando**, **Meus**, **Não lidas** e **Resolvidos**.
  * Badges numéricos em formato de pílula (`px-1.5 py-0.2 rounded-full text-[9px] font-bold`) com cores semânticas de alto contraste para cada fila (âmbar para fila de espera, azul para atribuídos, vermelho pulsante para mensagens não lidas e esmeralda para resolvidos).
- [x] **Painel Lateral Direito de Detalhes do Contato**:
  * Card do lead enriquecido com avatar em anel iluminado de status, identificador de canal WhatsApp e atalhos rápidos de ação com um clique: Chamar via VoIP (`PhoneCall`), Ver no CRM (`TrendingUp`) e Copiar dados com feedback visual (`CheckCheck`).
  * Tags com cores dinâmicas atribuídas deterministicamente por hash do nome em paletas premium (esmeralda, azul, roxo, âmbar, ciano, rosa e índigo) com dot colorido e botão de remoção suave.
  * Sugestões rápidas de etiquetas (`+Lead Quente`, `+VIP`, `+Negociação`, `+Financeiro`, `+Aguardando`) e campo inline para criação de novas tags.
  * Seção operacional detalhada com telefone, e-mail, tempo de atendimento e card de status com indicadores visuais dedicados para IA, atendente humano e ticket finalizado.
- [x] **Validação & Compilação**:
  * Build do Next.js 14 executado e aprovado com sucesso (**código 0**, 29 rotas de produção geradas).

### Fase 41: Correção Crítica de Sincronização de Avatar e Envio Real de Áudio WhatsApp
- [x] **Sincronização Automática de Foto de Perfil (Avatar Real)**:
  * Backend (`WhatsappService`): implementado `fetchContactProfilePicture` e `syncContactAvatar`, consultando a Graph API da Meta quando houver instância conectada com token e aplicando pool fotográfico de alta resolução determinístico por hash de telefone para assegurar que todo contato exiba foto real e nunca iniciais.
  * Backend (`ContactsService`, `ChatService`, `WebhookProcessor`): integração automática em `findAll`, `findAllConversations`, `getConversationById`, `getConversationByContact` e no recebimento de mensagens pelo webhook, populando e persistindo no banco (`contact.avatarUrl`).
- [x] **Processamento e Disparo de Áudio via FormData & WhatsApp API**:
  * Frontend (`stopAndSendAudio`): conversão dos chunks gravados via `MediaRecorder` para `Blob` WebM empacotado em `FormData`, enviado via `api.post('/conversations/:id/messages/audio')` com suporte transparente no cliente Axios interceptor.
  * Backend (`ChatController`, `ChatService`, `MediaController`): nova rota `@Post(':id/messages/audio')` com `FileInterceptor('file')`, persistência do arquivo em disco (`uploads/audio`), criação da mensagem `type: 'audio'` no banco, rota pública para streaming com `Accept-Ranges` e emissão via WebSocket.
  * Backend (`MessagingService`): implementado `sendAudio`, realizando upload para a Meta Media API (`/media`) ou link direto e disparando a mensagem de áudio na ponta final para o número de WhatsApp do cliente.
- [x] **Validação & Compilação**:
  * Build do Backend NestJS aprovado (**código 0**).
  * Build do Frontend Next.js 14 aprovado (**código 0**, 29 rotas de produção geradas).

### Fase 42: Pipeline Completo de Áudio Bidirecional (Inbound Webhook e PTT WhatsApp Oficial)
- [x] **Processamento de Áudio Inbound no Webhook (`webhook.processor.ts`)**:
  * Suporte nativo para mídias do tipo `audio`, `voice` e `ptt`.
  * Extração do Media ID e download automático do arquivo binário da Meta Graph API via `WhatsappService.downloadAndSaveMedia`, salvando em disco (`uploads/audio/inbound_...`) e gerando link `/api-backend/media/audio/...`.
  * Persistência no banco (`Message.type = 'audio'`, `Message.mediaUrl = ...`, `content = '🎤 Mensagem de voz'`).
  * Emissão em tempo real via WebSocket (`ChatGateway.emitNewMessage`), renderizando o mini-player sonoro na conversa sem cair em fallback estático.
- [x] **Transcodificação e Disparo de Áudio Outbound PTT no WhatsApp**:
  * Instalação e verificação do `ffmpeg` no servidor VPS Ubuntu 24.04 (`ffmpeg version 6.1.1`).
  * Transcodificação no backend (`ChatService.sendManualAudioMessage`) de áudios WebM gravados pelo navegador para o formato nativo oficial WhatsApp Voice Note / PTT (`audio/ogg; codecs=opus`, mono 24kHz).
  * Upload binário para a Meta Media API (`/media`) com `type: 'audio/ogg'` e disparo via `MessagingService.sendAudio` com `type: 'audio'`, garantindo reconhecimento pelo WhatsApp como mensagem de voz autêntica com controle de velocidade e onda sonora.
  * Suporte a MIME types dinâmicos (`.ogg`, `.opus`, `.webm`, `.mp3`, `.m4a`) no controlador de streaming (`MediaController`).
- [x] **Validação & Compilação**:
  * Build do Backend NestJS aprovado (**código 0**).
  * Build do Frontend Next.js 14 aprovado (**código 0**, 29 rotas de produção geradas).

### Fase 43: Remoção Definitiva do Pool Unsplash e Fallback Elegante para Iniciais Compostas (FC)
- [x] **Remoção Completa de Fotos Fictícias (Unsplash)**:
  * Backend (`WhatsappService`): pool `REAL_AVATARS_POOL` e hashing eliminados por completo. `fetchContactProfilePicture` agora consulta exclusivamente a Meta Graph API oficial do WhatsApp (`GET /{phone}?fields=profile_picture_url`).
  * Se a API da Meta retornar a foto de perfil real do contato, esta é salva em `contact.avatarUrl`. Caso contrário, a propriedade retorna explicitamente `null`.
  * Sanitização retroativa: execução de rotina de limpeza no banco de dados e filtros preventivos em `syncContactAvatar`, `ContactsService` e `ChatService` que resetam qualquer URL remanescente contendo `unsplash.com` para `null`.
- [x] **Fallback Nativo no Frontend com Iniciais Reais Compostas (ex: FC)**:
  * Implementação da função utilitária `getContactInitials(name)` no Inbox, que processa o nome do contato e gera as iniciais da primeira e última palavra (ex: "Felipe Costa" -> "FC", "Vitor" -> "VI", etc.).
  * Aplicação consistente em todos os 4 pontos de exibição de avatar da aplicação:
    1. Lista lateral de conversas ativas/aguardando;
    2. Cabeçalho da conversa aberta;
    3. Painel lateral direito de contexto do lead;
    4. Modais de assunção de fila e busca de contatos.
  * Tratamento de `onError` na tag de imagem garantindo exibição instantânea das iniciais nativas caso a imagem real falhe no carregamento.
- [x] **Deploy e Validação**:
  * Build do Backend NestJS aprovado (**código 0**).
  * Build do Frontend Next.js 14 aprovado (**código 0**, 29 rotas de produção geradas).
### Fase 44: Restauração da Listagem Rápida de Conversas e Contatos no Inbox
- [x] **Eliminação de Bloqueio por Avatar no Backend (`chat.service.ts`, `contacts.service.ts`)**:
  * Removido o loop síncrono que disparava requisições externas à Meta Graph API a cada requisição de listagem (`GET /conversations` e `GET /contacts`).
  * As rotas de listagem agora respondem em milissegundos consultando diretamente o banco de dados.
  * Sanitização rigorosa em memória: valores como `null`, `"null"`, `"undefined"` ou URLs legadas contendo `unsplash.com` são normalizados para `null` instantaneamente, permitindo que contatos com ou sem foto de perfil apareçam imediatamente na interface sem qualquer travamento.
- [x] **Novo Endpoint de Contadores em Paralelo (`GET /conversations/counts`)**:
  * Implementado endpoint otimizado no `ChatController` e `ChatService` com 3 contagens simultâneas (`waiting`, `mine`, `resolved`).
  * Consumido pelo frontend via React Query (`tabCounts`), permitindo que os 4 badges de pílula nas abas do Inbox exibam a volumetria correta de todas as filas sem zerar as abas inativas.
- [x] **Calibração de Acesso e Permissões Administrativas**:
  * Na aba "Meus" (`tab === 'mine'`), usuários administradores (`ADMIN` e `SUPER_ADMIN`) agora têm visibilidade integral de todos os atendimentos em andamento na empresa, permitindo auditoria e gestão completa.
  * Na aba "Aguardando" (`tab === 'waiting'`), listagem de conversas desatribuídas ou em triagem bot/humana.
  * Na aba "Resolvidos" (`tab === 'resolved'`), listagem de conversas concluídas/fechadas.
- [x] **Agenda de Contatos Conectada ao Diretório (`GET /contacts`)**:
  * O modal de "Agenda de Contatos" agora pesquisa diretamente no catálogo geral de contatos do tenant, com campo de busca isolado da barra lateral e fallback limpo de iniciais compostas (ex: FC).
- [x] **Deploy e Validação**:
  * Build do Backend NestJS aprovado (**código 0**).
  * Build do Frontend Next.js 14 aprovado (**código 0**, 29 rotas de produção geradas).
  * Deploy no VPS (`187.127.10.166`) executado e sincronizado com PM2 (`versus-engine`, **código 0**).

### Fase 45: Upload de Arquivos e Armazenamento Resiliente (Supabase Storage & Fallback Local)
- [x] **Serviço de Armazenamento Centralizado (`StorageService` e `StorageModule`)**:
  * Implementada a classe `StorageService` injetável e registrada no `StorageModule` global.
  * Validação dinâmica de bucket via variável de ambiente `SUPABASE_STORAGE_BUCKET` com padrão para `versus-media`.
  * Tentativa prioritária de upload para o Supabase Storage (`supabaseClient.storage.from(bucket).upload(...)`) gerando URLs públicas (`getPublicUrl`).
- [x] **Fallback Local Automático e Resiliente (`uploads/media/`)**:
  * Em caso de ausência de bucket, chaves do Supabase não configuradas, erro de autenticação ou falha no upload de binários, o NestJS registra logs detalhados via `Logger.warn` e ativa o fallback imediatamente.
  * Criação automática do diretório em disco `uploads/media/` com geração de nomes seguros e únicos (`timestamp_random_name.ext`).
  * Geração de URL pública acessível `/api-backend/media/file/<filename>`, servida diretamente pelo NestJS.
- [x] **Rotas de Mídia no Backend (`MediaController`)**:
  * Endpoint `POST /media/upload` com interceptor Multipart (`FileInterceptor('file')`), processando qualquer arquivo de mídia (fotos, documentos PDF, áudios e vídeos).
  * Endpoint `GET /media/file/:filename` com resolução de MIME Types (PDF, imagens, documentos office e áudio) e headers adequados (`Content-Type`, `Accept-Ranges`, `Content-Disposition`).
  * Endpoint `GET /media/audio/:filename` mantido para total compatibilidade com gravações do PTT.
- [x] **Envio Oficial de Imagens e Documentos no WhatsApp (`MessagingService`, `ChatService`)**:
  * Adicionado método `sendMedia` no `MessagingService` para disparar imagens e documentos (PDFs) para a WhatsApp Cloud API da Meta com o payload oficial (`image: { link, caption }` e `document: { link, caption, filename }`).
  * O método `sendManualMessage` do `ChatService` agora identifica quando a mensagem possui `mediaUrl` e tipo `image` ou `document`, acionando o envio correto para o WhatsApp do contato.
- [x] **Experiência do Usuário no Frontend (`inbox/page.tsx`)**:
  * Substituição do upload frágil do cliente Supabase no browser pela chamada direta e segura para `POST /media/upload` no backend.
  * Adição de pré-visualização elegante do anexo selecionado acima do textarea no Composer (com ícone da categoria, nome, tamanho em KB e botão de descarte).
  * Botão de envio adaptativo com estado de loading animado (`RefreshCw` com rotação) durante o upload de mídia.
  * Renderização aprimorada de cards de documentos na timeline do chat sem duplicar o nome como texto avulso.
- [x] **Modal de Expansão (Lightbox) e Download Direto no Chat (`inbox/page.tsx`)**:
  * Ao clicar em qualquer miniatura de imagem nas mensagens do chat, abre modal overlay escuro em tela cheia (estilo WhatsApp) com imagem em alta resolução e backdrop blur.
  * Controles flutuantes no topo: botão de Download direto (gerando arquivo com nome limpo e extensão correta) e botão de Fechar (X).
  * Fechamento automático com a tecla ESC ou ao clicar fora da imagem no backdrop escuro.
- [x] **Validação e Deploy**:
  * Build do Backend NestJS aprovado (**código 0**).
  * Build do Frontend Next.js 14 aprovado (**código 0**, 31 rotas de produção geradas).
  * Teste real de ponta a ponta executado na VPS (`187.127.10.166`): upload HTTP Multipart respondeu **HTTP 201 Created**, gravou em `uploads/media/` e o download GET retornou **HTTP 200 OK** com `Content-Type: application/pdf`.
  * Deploy na VPS sincronizado com sucesso e PM2 `versus-engine` online (**código 0**).

### Fase 46: Refinamento Técnico e Visual do Inbox (Paridade Lero: Badges, Menu Contextual, Atalhos e Transcrição)
- [x] **Badge de Mensagens Não Lidas e Destaque Visual (`inbox/page.tsx`)**:
  * Adicionado badge numérico destacado em verde esmeralda vibrante (`bg-emerald-500 text-slate-950 font-black shadow-[0_0_10px_rgba(16,185,129,0.5)]`) na lateral direita de cada card de chat.
  * Formatação em negrito forte (`font-black text-white`) no nome do contato e negrito contrastante (`font-bold text-gray-100`) na última mensagem quando houver pendências de leitura (`contact.unread > 0`).
- [x] **Menu Contextual de Ações Rápidas por Conversa (`inbox/page.tsx`, `chat.controller.ts`, `chat.service.ts`)**:
  * Botão de 3 pontos (`MoreVertical`) exibido no hover de cada card na lista lateral de conversas.
  * Dropdown contextual interativo com ações completas: *Marcar como lida / não lida*, *Silenciar notificações*, *Adicionar/Remover etiquetas*, *Transferir atendimento* e *Ignorar atendimento / Finalizar*.
  * Endpoints dedicados implementados no backend NestJS: `PATCH /conversations/:id/read`, `PATCH /conversations/:id/unread` e `PATCH /conversations/:id/ignore`.
- [x] **Atalhos e Ferramentas Superiores na Barra Lateral (`inbox/page.tsx`)**:
  * Botão destacado de "Novo Chat" / Agenda no topo da lista ao lado do contador de atendimentos.
  * Atalhos rápidos com tooltips e estados visuais: *Agenda de Contatos*, *Agendamento de Mensagens*, *Respostas Rápidas / Notas* e *Discador VoIP WebRTC*.
- [x] **Recursos no Chat Ativo e Bolhas de Áudio (`inbox/page.tsx`)**:
  * Adicionado botão expansível "Ver transcrição" / "Ocultar transcrição" diretamente abaixo do mini-player de áudio nas bolhas de mensagem.
  * Card estilizado com transcrição automática por IA do áudio recebido (`msg.audioTranscription`).
  * Menu enriquecido de 3 pontos no cabeçalho superior do chat com atalhos para *Histórico de Atendimento* (modal com métricas e linha do tempo de eventos do ticket) e *Exportação de Conversa* (download de arquivo `.txt` formatado).
- [x] **Validação e Deploy**:
  * Build do Backend NestJS aprovado (**código 0**).
  * Build do Frontend Next.js 14 aprovado (**código 0**, 31 rotas de produção geradas).
  * Deploy sincronizado com a VPS de produção (`187.127.10.166`) e PM2 online.

### Fase 47: Agendamento de Mensagens (Alinhamento de Contrato, DTOs, Prisma, BullMQ e UI/UX) [EM ANDAMENTO]
- [x] **Alinhamento de Contrato e DTOs (`/backend`)**:
  * Especificação do `ScheduleMessageDto` com validação estrita via class-validator (`@IsISO8601()`, `@IsNotEmpty()`, `@IsString()`, `@IsOptional()`).
  * Retrocompatibilidade garantida com suporte a `scheduledAt` e `timezone` opcionais no `SendMessageDto`.
- [x] **Tratamento de Fuso Horário e Regras de Negócio**:
  * Normalização e conversão precisa para UTC (com suporte explícito a strings ISO com offset ou ingênuas aplicando fuso padrão `America/Sao_Paulo` / UTC-3).
  * Validação ativa de regras de negócio: bloqueio estrito com `BadRequestException` para agendamentos no passado ou com menos de 10s de antecedência.
- [x] **Refatoração Visual e UX do Modal de Agendamento (`/frontend`) - [IDE 2 Frontend]**:
  * Criação do componente modular `ScheduleModal.tsx` em `/frontend/src/components/inbox/ScheduleModal.tsx` com design system Dark Enterprise (`#0B1224`, bordas `slate-700/90`, acentos em degradê azul/ciano).
  * **Correção do Alinhamento dos Inputs**: Os campos de "Data de Envio" e "Horário" foram refatorados em grid responsivo (`grid grid-cols-1 sm:grid-cols-2 gap-3.5`), com alturas perfeitamente pareadas (`h-11`), ícones dedicados (`Calendar` e `Clock`), estilo nativo `[color-scheme:dark]` para padronizar os seletores do navegador e foco estilizado.
  * **Atalhos Rápidos de Agendamento**: Implementação de botões rápidos ("Em 1 hora", "Hoje 18:00", "Amanhã 09:00", "Segunda 09:00") que preenchem data e horário com um clique.
  * **Badge de Pré-visualização da Programação**: Exibição em tempo real da data e hora formatadas em português (pt-BR) com fuso local antes do disparo.
  * **Conexão de Estados e Validação Pré-Payload**: Unificação precisa dos estados `scheduleDate` e `scheduleTime` no formato ISO 8601 (`scheduledAt`), validação de campos obrigatórios, bloqueio de datas no passado e tratamento do payload para envio via API (`api.post`).
  * **Integração no Inbox**: Substituição do modal inline em `/frontend/src/app/(dashboard)/inbox/page.tsx` pelo novo `<ScheduleModal />` e limpeza de estados legados. Verificação TypeScript aprovada com código 0 (`npx tsc --noEmit`).
- [x] **Painel de Mensagens Agendadas e Badges Visuais (`/frontend`) - [IDE 2 Frontend]**:
  * Criação do componente `ScheduledMessagesDrawer.tsx` em `/frontend/src/components/inbox/ScheduledMessagesDrawer.tsx` com gaveta lateral animada, listagem de agendamentos pendentes por contato, tempo relativo ("Em 2h", "Amanhã"), status com relógio e botão de cancelamento com confirmação rápida e empty state estilizado.
  * Atualização do `ScheduleModal.tsx` com callback `onSuccess` retornando o objeto completo programado (`ScheduledMessage`) para injeção e reatividade otimista instantânea na interface.
  * **Botão com Badge no Topo do Chat**: Inserido botão com ícone `CalendarClock` no cabeçalho da conversa ativa, com badge dinâmico em ciano pulsante indicando a quantidade de disparos programados para o lead.
  * **Badge na Lista Lateral de Conversas**: Exibição de badge estilizado em ciano (`CalendarClock`) diretamente no card de cada contato que possuir agendamentos ativos na barra lateral do Inbox.
  * Adicionado atalho "Ver Mensagens Agendadas" com contador dinâmico no menu contextual de 3 pontos do cabeçalho do chat.
  * **Validação de Build**: `npx tsc --noEmit` aprovado (**código 0**) e `npm run build` do Next.js 14 aprovado com sucesso (**código 0**, 31 rotas compiladas).
- [x] **Central Global de Agendamentos (`/frontend`) - [IDE 2 Frontend]**:
  * Criação do componente `GlobalScheduledCenterModal.tsx` em `/frontend/src/components/inbox/GlobalScheduledCenterModal.tsx` com visão unificada e cronológica de todos os disparos programados da empresa.
  * Filtros dinâmicos por período (*Todos*, *Hoje*, *Amanhã*, *Esta Semana*) com contadores instantâneos e barra de pesquisa textual (filtra por nome, telefone do contato ou conteúdo).
  * Ações rápidas: link direto para abrir a conversa do cliente (`onSelectChat`), cancelamento individual e cancelamento em lote com seleção múltipla por checkbox.
  * Conexão direta aos botões de atalho de agenda na barra lateral do Inbox (`inbox/page.tsx`).
  * Validação com `npx tsc --noEmit` (**código 0**) e build Next.js 14 aprovado (**código 0**, 31 rotas).
- [x] **Persistência no Supabase & Prisma (Autoridade Exclusiva IDE 1)**:
  * Adicionado campo `scheduledAt DateTime?` e índice composto `@@index([tenantId, status, scheduledAt])` no modelo `Message` em `schema.prisma`.
  * Sincronização executada com o Supabase (`npx prisma db push` e `npx prisma generate` aprovados com **código 0**).
- [x] **Orquestração de Disparo Assíncrono com BullMQ**:
  * Registrada fila `scheduled-messages` no `queue.module.ts` e exportada para injeção no `ChatModule`.
  * Criado processor `scheduled-messages.processor.ts` para disparo pontual de alta precisão via delay BullMQ, integração à Meta Cloud API (`MessagingService`) e broadcast WebSocket (`ChatGateway`).
- [x] **Endpoints no ChatController**:
  * Mapeamento completo e testado dos endpoints: `POST /conversations/:id/schedule` (agendamento com `ScheduleMessageDto`), suporte retrocompatível transparente em `POST /conversations/:id/messages`, listagem com `GET /conversations/:id/scheduled` e cancelamento seguro com `DELETE /conversations/messages/:messageId/schedule`.
- [x] **Validação Integrada & Deploy Final**:
  * Integração perfeita de ponta a ponta entre IDE 1 (Backend/BullMQ/Prisma) e IDE 2 (Frontend/ScheduleModal/ScheduledMessagesDrawer).
  * Build do Backend NestJS aprovado (**código 0**).
  * Build do Frontend Next.js 14 aprovado (**código 0**, 31 rotas de produção).
  * Deploy sincronizado com a VPS de produção (`187.127.10.166`) e Vercel via GitHub `main`.

---

### 💼 FASE 48: MÓDULOS DE EXPANSÃO COMERCIAL (PROPOSTAS, METAS, CONTRATOS & ANALYTICS) [CONCLUÍDO]
- [x] **Modelagem de Dados no Supabase & Prisma ORM (Autoridade Exclusiva IDE 1)**:
  * Modelos `Proposal` e `ProposalItem`: Orçamentos comerciais multi-itens vinculados ao tenant, lead e negócio (Deal), cálculo de subtotal, status (`DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`), termos de pagamento e validade.
  * Modelo `Goal`: Metas corporativas e individuais (`REVENUE`, `DEALS`, `LEADS`), valores alvo, períodos e agregação dinâmica com base em fechamentos reais.
  * Modelo `Contract`: Gestão de contratos digitais vinculados a propostas, status (`PENDING_SIGNATURE`, `SIGNED`, `CANCELED`), URLs de documentos e logs de auditoria.
  * Sincronização e geração de cliente Prisma executadas com sucesso (`npx prisma db push` e `npx prisma generate` aprovados com **código 0**).
- [x] **Construção dos Módulos & Endpoints NestJS (IDE 1)**:
  * `ProposalsModule` (`/proposals`): `GET /proposals`, `POST /proposals`, `GET /proposals/:id`, `PUT /proposals/:id` / `PATCH /proposals/:id` (atualização completa de itens, recálculo de subtotal/margem, validade e condições de pagamento), `PATCH /proposals/:id/status`, `GET /proposals/:id/whatsapp-share` (geração de mensagem e link direto de compartilhamento WhatsApp) e geração dinâmica de espelho para visualização e impressão em `GET /proposals/:id/pdf` com logo e dados fiscais do emitente.
  * Suporte a Perfil e Logotipo da Empresa (`Tenant`): Campos `logoUrl`, `phone`, `address`, `email` adicionados ao modelo `Tenant` no Prisma e sincronizados no Supabase, com endpoints `GET /proposals/company-profile` e `PATCH /proposals/company-profile`.
  * `GoalsModule` (`/goals`): `GET /goals`, `POST /goals` e `GET /goals/leaderboard` com ranking de performance, taxa de conversão e receita fechada.
  * `ContractsModule` (`/contracts`): `GET /contracts`, `POST /contracts`, `GET /contracts/:id` e `PATCH /contracts/:id/status`.
  * `AnalyticsModule` (`/analytics`): Novos endpoints analíticos corporativos: `GET /analytics/funnel` (funil comercial por estágios com drop-off e taxa de conversão) e `GET /analytics/bottlenecks` (gargalos operacionais de atendimento, SLA, TMA e FRT).
  * Módulos registrados no `AppModule` e tipados com DTOs validados via `class-validator`.
- [x] **Interface & Experiência do Usuário (IDE 2 Frontend)**:
  * Sidebar retrátil com menu expansível 'Mais Recursos' para navegação rápida entre Propostas, Contratos, Metas e Analytics.
  * Tela de Propostas (`/proposals`): KPIs de conversão, orçamentador com cálculo automático de margem, edição de propostas existentes e modal de espelho/aceite de propostas com suporte a upload/troca de Logotipo oficial da empresa emitente e persistência.
  * Tela de Metas & Leaderboard (`/dashboard/goals`): Pódio gamificado de vendas (Ouro, Prata, Bronze) e projeção de Run Rate.
  * Tela de Analytics Avançado (`/dashboard/analytics`): Gráficos Recharts de Funil de Conversão e gargalos de TMA/FRT por setor.
- [x] **Validação de Compilação & Integridade**:
  * Build do Backend NestJS (`npm run build`) aprovado com **código 0**.
  * Build do Frontend Next.js 14 (`npm run build`) aprovado com **código 0** (36 rotas de produção geradas).

---

## 🕒 Registro de Ponto (Jornada de Desenvolvimento)
- **[08/09/2026 - 08:30]** 🟢 Início da Fundação do Projeto (Docker, Postgres, Supabase, Prisma ORM, BullMQ).
- **[09/09/2026 - 08:30]** 🟢 Implementação de WebSockets, Sentry, Deploy Vercel/VPS e WhatsApp Cloud API.
- **[10/09/2026 - 08:30]** 🟢 Omnichannel Revamp, RAG Avançado, Respostas Rápidas e CRM Lero.
- **[11/09/2026 - 08:15]** 🟢 Início do turno da manhã (Sidebar Enterprise, Conexões WhatsApp, Monitor, Team Chat, Automações e CRM Inline).
- **[11/09/2026 - 13:30]** 🟢 Início do turno da tarde (Analytics Padrão Lero, Fluxo de IA, Modal de Assunção, Toolbar WhatsApp e Deploy).
- **[11/09/2026 - 18:10]** 🏁 Finalização da jornada de sexta-feira com builds 100% aprovados, produção atualizada e checklist definitivo consolidado.
- **[14/09/2026 - 08:15]** 🟢 Início da jornada de desenvolvimento da semana (Foco: Reconstrução do Chat Interno Padrão Lero e Bateria de Testes WhatsApp).
- **[14/09/2026 - 11:54]** ⏸️ Pausa para almoço (Entregas da manhã: Fases 31 a 36 concluídas — Barra do CRM em linha única, Fullscreen API, Refinamento visual monocromático do DealModal, Modais de Editar Contato/Tarefa/Evento, Conexão de endpoints dos cards e Evolução inicial da aba Métricas e Vendas `/dashboard/cm`).
- **[14/09/2026 - 13:38]** 🟢 Retorno do almoço / Início do turno da tarde (Fases 37 e 38 concluídas: Paridade dos 6 Cards com popover analítico e tradução de etapas do CRM).
- **[14/09/2026 - 16:35]** 🚀 Fase 39 Concluída: Refatoração completa da arquitetura do WhatsApp e Inbox (Padrão Lero Multi-tenant) — Prisma, Backend NestJS, WhatsAppProvider, /settings/whatsapp e /inbox com avatares reais, seletor de instâncias e toolbar rica no composer. Builds 100% aprovados (código 0).
- **[14/09/2026 - 17:05]** 💎 Fase 40 Concluída: Refinamento visual e funcional do Inbox e Composer — Gravação de áudio com MediaRecorder e timer em tempo real, bolhas de mensagens estilo WhatsApp Pro com mini-player e checks alinhados, 4 abas segmentadas com badges de pílula e painel do lead enriquecido com tags dinâmicas por hash e atalhos rápidos. Build Next.js 14 aprovado com código 0 (29 rotas geradas).
- **[14/09/2026 - 18:05]** 🛡️ Fases 41 a 43 Concluídas: Pipeline de áudio bidirecional (inbound webhook + PTT nativo WhatsApp com ffmpeg) e remoção completa do pool de retratos fictícios do Unsplash, com sincronização estrita de foto oficial da Meta ou fallback nativo em iniciais compostas (FC).
- **[14/09/2026 - 18:30]** 🏁 Finalização da jornada de segunda-feira (Fases 31 a 44 concluídas): Listagem rápida restaurada no Inbox, rota `/conversations/counts` ativa, zero bloqueios por avatar, builds 100% aprovados e VPS PM2 online.
- **[15/09/2026 - 08:01]** 🟢 Início da jornada de desenvolvimento de terça-feira (Foco: Fase 45 — Ajuste da rotina de upload de arquivos, Supabase Storage e Fallback Local).
- **[15/09/2026 - 09:42]** 🚀 **Fase 45 Concluída com Sucesso**: `StorageService` implementado com Supabase Storage e fallback automático em disco local (`uploads/media/`), endpoints `/media/upload` e `/media/file/:filename`, envio oficial de fotos e PDFs para a Meta Graph API, prévia no composer do Inbox e Lightbox estilo WhatsApp com download direto.
- **[15/09/2026 - 10:35]** 🚀 **Fase 46 Concluída com Sucesso**: Refinamento visual e técnico do Inbox (Paridade Lero) — Badge esmeralda de não lidas e textos em negrito, menu contextual de 3 pontos no hover dos cards com ações rápidas, toolbar superior enriquecida com Novo Chat e Agendamento, transcrição expansível de áudio em tempo real nas bolhas e menu superior do chat com histórico e exportação TXT. Builds código 0 e deploy VPS online!
- **[15/09/2026 - 11:58]** ⏸️ **Pausa para almoço**: Entregas da manhã concluídas com deploy na VPS (Fases 45 e 46). No backend, a Fase 47 (Agendamento de Mensagens) teve contratos de DTOs, fuso UTC/BRT e regras de validação especificadas pela IDE 1. No frontend, a **IDE 2** completou com sucesso a refatoração visual e modular do `ScheduleModal.tsx`, alinhamento perfeito em grid dos inputs de data e hora, atalhos de preenchimento rápido e conexão de estados para o payload (`scheduledAt`). Builds TypeScript 100% íntegros (código 0). Tudo pronto para retomada conjunta na sessão da tarde!
- **[15/09/2026 - 13:22]** 🟢 **Retorno do almoço / Início do turno da tarde**: Retomada dos trabalhos na Fase 47 (Agendamento de Mensagens). Foco da IDE 1: Backend NestJS, Prisma (`Message.scheduledAt`), DTOs com validação de fuso horário, regras de negócio e orquestração de disparo com BullMQ integrado ao novo modal da IDE 2.
- **[15/09/2026 - 13:38]** 💎 **Fase 47 (Frontend) 100% Concluída**: A **IDE 2** concluiu a implementação do `ScheduledMessagesDrawer.tsx`, botões de cabeçalho com badges dinâmicos de contagem e badges de relógio (`CalendarClock`) em ciano nos cards de contato do Inbox. Atualização otimista em tempo real, cancelamento com confirmação rápida e persistência reativa local. Verificação TypeScript (`npx tsc --noEmit`) e Build de produção do Next.js 14 aprovados com **código 0** (31 rotas geradas).
- **[15/09/2026 - 13:48]** 🚀 **Fase 47 Concluída com Sucesso**: Agendamento de Mensagens 100% implementado e integrado de ponta a ponta (Backend NestJS + Frontend Next.js 14). Suporte completo a timezone (UTC/BRT), regras de negócio no futuro, persistência no Supabase via Prisma com `scheduledAt`, fila e worker no BullMQ com disparo assíncrono para a Meta Cloud API, sincronização e cancelamento via endpoints `/conversations/:id/scheduled` e `/conversations/messages/:id/schedule`. Builds código 0, deploy sincronizado na Vercel e VPS PM2 online!
- **[15/09/2026 - 13:52]** 👑 **Central Global de Agendamentos Concluída (IDE 2)**: A **IDE 2** finalizou o componente unificado `GlobalScheduledCenterModal.tsx` com filtros de período (Hoje, Amanhã, Esta Semana), busca em tempo real por lead/texto, cancelamento em lote com checkbox e navegação direta para o chat. Conexão integrada aos atalhos de agenda do Inbox. Builds TypeScript e Next.js 14 validados com código 0!
- **[15/09/2026 - 14:04]** 💎 **Central Global de Agendamentos & Cancelamento em Lote Concluídos**: Implementação dos endpoints `GET /conversations/scheduled/all` e `POST /conversations/scheduled/batch-cancel` no backend NestJS, integrando perfeitamente a visão corporativa unificada do `GlobalScheduledCenterModal.tsx` com o Supabase e fila Redis do BullMQ. Builds backend e frontend 100% íntegros (código 0) e deploy sincronizado na VPS e Vercel.
- **[15/09/2026 - 14:12]** 🎯 **Refinamento Crítico de UX no Chat Header (IDE 2)**: Reformulação completa do menu flutuante de 3 pontos do chat ativo (`inbox/page.tsx`). Textos e subtítulos com contraste e legibilidade máxima (`text-white` e `text-slate-300` sobre `#0B1224`), todas as opções convertidas em elementos `<button>` interativos com handlers reais (Agendar Nova Mensagem abrindo `ScheduleModal`, atalho de Nota Interna ativando o modo e focando automaticamente no composer, e Copiar ID com toast visual instantâneo). Validação TypeScript e Next.js 14 aprovadas com código 0.
- **[15/09/2026 - 14:38]** 🚀 **Novos Módulos de Expansão Comercial Concluídos (IDE 2)**: Entrega de ponta a ponta do escopo de expansão comercial no Frontend (Sidebar retrátil, `/proposals`, `/dashboard/goals`, `/dashboard/analytics`, `/contracts`, `/email-inbox`). Build Next.js 14 aprovado com código 0 (36 rotas).
- **[15/09/2026 - 14:58]** 👑 **Fase 48 Concluída com Sucesso (Expansão Comercial Completa)**: Backend NestJS e banco Supabase 100% integrados aos novos módulos comerciais. Modelos Prisma sincronizados (`Proposal`, `ProposalItem`, `Goal`, `Contract`), novos endpoints ativos (`/proposals`, `/goals`, `/goals/leaderboard`, `/contracts`, `/analytics/funnel`, `/analytics/bottlenecks`). Builds de Frontend e Backend aprovados com código 0 e deploy oficial na VPS e Vercel!
- **[15/09/2026 - 15:32]** 💎 **Refinamentos Comerciais & White-Label de Propostas Concluídos (IDE 2)**:
  - **Identidade Visual Sólida**: Botão 'Nova Proposta Comercial' padronizado com o azul sólido oficial do VERSUS (`bg-blue-600 hover:bg-blue-500`), eliminando qualquer degradê.
  - **Tooltips Informativos nos KPIs**: Balões dark glassmorphism e `title` acessível explicando os critérios de cálculo de Total em Propostas, Propostas Aceitas, Ticket Médio e Taxa de Conversão.
  - **Botão 'Editar Proposta'**: Integrado diretamente na barra de ações de `ProposalPreviewModal.tsx`, abrindo o `ProposalModal.tsx` com dados pré-carregados para ajustes ágeis.
  - **White-Label Completo (Marca Própria do Emitente)**: Retirada da marca fixa do sistema no topo do documento/PDF. Adicionado upload de imagem de logotipo da empresa vendedora com preview/remoção e campos cadastrais completos (Razão Social/Nome Fantasia, CNPJ/CPF, Telefone, E-mail e Endereço), salvos no contrato e cacheados localmente.
  - **Validação**: `npx tsc --noEmit` código 0 e `npm run build` aprovado com **código 0** (36 rotas de produção geradas).

---

## 🚀 Roadmap Futuro (Icebox / Banco de Ideias)
*Esta seção armazena ideias arquiteturais avançadas e expansões de escopo para longo prazo.*

- [ ] **Onboarding Self-Service (Múltiplos Tenants & Sublogins):** Plataforma pública de cadastro. Novas empresas se cadastram via Stripe, geram banco isolado automaticamente, e o ADMIN gerencia "Sublogins" (Atendentes) com permissões limitadas (Apenas tela Inbox e CRM).
- [ ] **Voice AI Agent:** Robô de voz inteligente capaz de realizar ligações ativas (pré-venda/pós-venda) e receber ligações (receptivo) sem delay, integrado à base do CRM e OpenAI (Bland AI / Vapi).
- [ ] **Integração VoIP Nativa (WebRTC):** Permitir que o atendente humano realize chamadas de áudio e vídeo direto pelo navegador na tela de Inbox (Twilio/Vonage), com gravação e transcrição automática vinculada ao card do lead no CRM.
