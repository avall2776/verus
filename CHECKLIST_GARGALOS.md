# CHECKLIST DE GARGALOS ESTRUTURAIS - VERSUS (VALLOR)

Plano de modernização estrutural e resolução gradual dos 6 gargalos priorizados do sistema VERSUS.

---

### [CONCLUÍDO] 01. Modo Dia e Noite (Dark / Light Mode)
- **Status:** Concluído (Peneira e Auditoria 100% Finalizadas em todos os menus/submenus; TypeScript `tsc` código 0; Build Next.js `npm run build` 52/52 páginas estáticas geradas com código 0)
- **Descrição:** Suporte nativo a alternância suave entre o tema escuro corporativo (`#0B1224`, `#0F172A`, slate) e tema claro profissional sóbrio (`#F8FAFC`, `#FFFFFF`, bordas `#E2E8F0` e textos `#0F172A`, `#334155`).
- **Recursos e Módulos Auditados e Refatorados:**
  1. **Operação e Atendimento:** Monitor em Tempo Real ([monitor/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/monitor/page.tsx)), WhatsApp/Inbox Oficial ([inbox/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/inbox/page.tsx)) e Métricas de Atendimento ([dashboard/atendimento/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/dashboard/atendimento/page.tsx)).
  2. **Chat da Equipe:** Chat Interno completo ([chat-interno/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/chat-interno/page.tsx)) com seleção de colaboradores, canais, balões e composer.
  3. **Marketing e Agência:** Kanban de Produção ([agency/marketing/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/agency/marketing/page.tsx)), Clientes & Escopos ([clients/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/agency/marketing/clients/page.tsx)), Cronograma ([schedule/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/agency/marketing/schedule/page.tsx)), Biblioteca de Mídia Google Drive ([media/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/agency/marketing/media/page.tsx)) e todos os 14 componentes e modais de marketing.
  4. **Funil Comercial (CRM):** Oportunidades ([crm/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/crm/page.tsx)), Métricas de Vendas ([dashboard/crm/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/dashboard/crm/page.tsx)) e Modal Executivo de Negociações ([DealModal.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/components/crm/DealModal.tsx)).
  5. **Mais Recursos:** Propostas Comerciais ([proposals/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/proposals/page.tsx)), Contratos ([contracts/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/contracts/page.tsx)), Metas Comerciais ([dashboard/goals/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/dashboard/goals/page.tsx)), Analytics Avançado ([dashboard/analytics/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/dashboard/analytics/page.tsx)), Inbox de E-mail ([email-inbox/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/email-inbox/page.tsx)), Central de Suporte ([support/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/support/page.tsx)) e Relatórios Executivos ([relatorio/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/relatorio/page.tsx)).
  6. **Sistema e Administração:** Visão Geral ([dashboard/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/dashboard/page.tsx)), Base de Contatos ([contacts/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/contacts/page.tsx)), Conexões WhatsApp ([settings/whatsapp/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/settings/whatsapp/page.tsx)), Configurações Gerais com todas as abas ([settings/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/settings/page.tsx)) e Painel Super Admin completo com Engenharia, Empresas, Operadores e Suporte.
  7. **Persistência e UX:** Configurado `darkMode: 'class'`, script anti-flicker no `<head>`, tokens HSL sóbrios em [globals.css](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/globals.css) e toggles sincronizados na Sidebar e Topbar.

---

### [CONCLUÍDO] 02. Filtro do CRM por Data de Início e Data de Fechamento
- **Status:** Concluído (Seletor de Período Executivo no CRM/Kanban/Tabela/Timeline, auditoria de datas de criação e fechamento, TypeScript `tsc` código 0, NestJS `nest build` código 0)
- **Descrição:** Implementação completa do seletor de período no CRM corporativo para visualização e filtragem dinâmica de oportunidades por **Data de Início (Criação/Entrada do Lead)** e **Data de Fechamento (Conclusão Ganha/Perdida/Desqualificada)**.
- **Recursos Entregues:**
  1. **Seletor de Período Executivo (Topbar do CRM):** Botão dinâmico posicionado na barra superior ao lado da busca com badge de status ativo, label contextual, botão de limpeza rápida (1 clique) e popover moderno com backdrop dismiss.
  2. **Segmented Toggle de Modo:** Alternância entre `🚀 Data de Início (Criação)` e `🏁 Data de Fechamento (Fim)` com explicação contextual.
  3. **10 Atalhos Rápidos de Período:** Todo o histórico, Hoje, Ontem, Últimos 7 dias, Últimos 15 dias, Últimos 30 dias, Este Mês, Mês Passado, Este Ano e Personalizado.
  4. **Seletor de Intervalo Personalizado:** Inputs HTML5 nativos `De:` e `Até:` com formatação e sincronização reativa imediata.
  5. **Filtragem Reativa Instantânea (0ms):** Aplicação em cascata em todas as 3 visões do CRM (Quadro Kanban, Tabela Densa e Linha do Tempo Semanal), além de contador dinâmico de oportunidades filtradas.
  6. **Auditoria e Stamping de Fechamento (`closedAt`):** Registro automático do timestamp de conclusão no metadados do negócio ao mover para Ganho/Perdido (via drag & drop ou modal de perda) e limpeza ao reabrir/reativar a negociação.
  7. **Cards do Kanban (`DealCard`):** Exibição de Data de Início e Data de Fechamento/Fim em cada oportunidade para clareza visual imediata.
  8. **Visão em Tabela do CRM:** Adição da coluna `Data de Fechamento`, opções de visibilidade, ordenação interativa (`handleSort`) e integração com o popover de filtros da tabela.
  9. **Modal Executivo (`DealModal.tsx`):** Exibição das datas de início e fechamento na seção de informações cadastrais e no rodapé lateral de auditoria.
  10. **Backend Sync:** Suporte a filtros de consulta por `startDate`, `endDate`, `dateType` e `status` no controller e service do NestJS.

---

### [CONCLUÍDO] 03. Departamentos e Associação Direta de Usuários
- **Status:** Concluído (Associação N:N de operadores a múltiplos departamentos, filtros por setor em tempo real no Chat/Inbox, badges com cores do departamento, exibição do operador e setor na conversa ativa e gaveta lateral, distribuição para fila do setor ou atendente direto, compilação TypeScript `tsc` código 0, NestJS `nest build` código 0)
- **Descrição:** Associação direta de operadores/usuários a múltiplos setores corporativos com controle granular de filas no Inbox e distribuição inteligente de atendimentos.
- **Recursos Entregues:**
  1. **Associação N:N de Usuários e Departamentos no Backend:**
     - Endpoints `findAll`, `create` e `update` em `users.controller.ts` integrados com a tabela relacional `UserDepartment`.
     - Suporte a `departmentIds?: string[]` no envio de convites e edição de colaboradores, sincronizando os setores com validação estrita de segurança e isolamento multi-tenant.
  2. **Consulta e Filtro no Chat/Inbox:**
     - Query parameter `@Query('departmentId')` adicionado nos endpoints `GET /conversations` e `GET /conversations/counts`.
     - `findAllConversations` e `getConversationCounts` em `chat.service.ts` filtrando dinamicamente por departamento.
     - Carregamento de `assignedUser` com dados do operador e seus respectivos setores (`departments.department`) e injeção nas conversas.
  3. **Eventos em Tempo Real (WebSocket):**
     - Transmissão de `conversationUpdated` e `conversationTransferred` com dados completos da conversa, departamento e operador responsável.
     - Listener do WebSocket no frontend (`conversationTransferred`) atualizando conversas e contadores de fila instantaneamente.
  4. **Gestão de Usuários (`UsersSettingsTab.tsx`):**
     - Carregamento assíncrono dos departamentos disponíveis no tenant.
     - Componente seletor de departamentos (`DepartmentSelector`) com chips clicáveis, bolinhas coloridas e seleção múltipla nos modais de Convidar e Editar Usuário.
     - Exibição de badges com as cores e nomes dos setores associados a cada colaborador na listagem de usuários.
  5. **Gestão de Departamentos (`DepartmentsSettingsTab.tsx`):**
     - Refinamento visual com suporte completo a Dark/Light mode, tokens de cor semânticos e gerenciamento de membros vinculados.
  6. **Filtros por Setor no Chat/Inbox (`inbox/page.tsx`):**
     - Barra horizontal de filtros por departamento posicionada logo abaixo das abas de atendimento ("Todos", "Comercial", "Suporte", etc.).
     - Filtragem reativa na lista lateral e atualização dos contadores de abas (`tabCounts`) respeitando o departamento selecionado.
  7. **Badges de Setor e Atendente nos Cards de Conversa:**
     - Cada card da lista lateral exibe o badge estilizado do departamento da conversa e o nome do atendente atribuído.
  8. **Header da Conversa Ativa e Gaveta de Detalhes:**
     - Exibição do badge do departamento ao lado do nome do contato com ação rápida de transferência ao clicar.
     - Subtítulo detalhado indicando o operador responsável e os setores aos quais ele pertence.
     - Painel lateral de detalhes com seção de status operacional indicando departamento e operador atribuído com botão de transferência.
  9. **Distribuição e Transferência Completa de Tickets:**
     - Modal de transferência aprimorado permitindo tanto a transferência para a fila geral do setor quanto a atribuição direta para qualquer atendente daquele departamento.
     - Toast feedback e preservação de SLA de espera.

---

### [CONCLUÍDO] 04. Upgrade do Atalho '/' (Catálogo de Arquivos/Produtos via Drive)
- **Status:** Concluído (Integração com Google Drive sob demanda com streaming em memória e Base64, zero consumo de disco/banco, cadastro de catálogos/PDFs/fotos/vídeos em Configurações, detecção automática de links do Drive, atalho `/` no chat com disparo de mídia nativa no WhatsApp do lead; compilação NestJS `nest build` código 0, compilação Next.js `npm run build` 52/52 páginas estáticas geradas com código 0).
- **Descrição:** Envio rápido de PDFs, fotos e materiais do catálogo corporativo diretamente através do atalho `/` no chat, com armazenamento 100% no Google Drive e entrega do anexo nativo no WhatsApp do cliente (sem links de texto).
- **Recursos Entregues:**
  1. **Modelo de Dados & Metadados Leves (`QuickReply` via Prisma PostgreSQL):**
     - Adição dos campos `title`, `type` (`text` | `document` | `image` | `video`), `mediaUrl`, `mediaDriveId`, `fileName` e `updatedAt`.
     - Armazenamento 100% desacoplado: o banco guarda apenas ~200 bytes de metadados por item, preservando o disco do servidor VPS livre de gigabytes de materiais.
  2. **Streaming Proxy e Conversão para WhatsApp ([google-drive.helper.ts](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/backend/src/shared/helpers/google-drive.helper.ts)):**
     - Utilitário backend para extração automática de IDs do Google Drive (`extractGoogleDriveId`), detecção de MIME types e fallback resiliente via Google Drive API Key (`GOOGLE_DRIVE_API_KEY`) e link direto UC (`export=download`).
     - Conversão em tempo de execução para buffer Base64 (para disparo ultra rápido na Evolution API) e endpoint público de streaming pass-through `GET /media/drive-stream/:driveId` em [media.controller.ts](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/backend/src/modules/chat/media.controller.ts) para compatibilidade nativa com Meta Cloud API e WhatsApp Web.
  3. **Disparo de Mídia Nativa ([messaging.service.ts](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/backend/src/modules/messaging/messaging.service.ts) e [chat.service.ts](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/backend/src/modules/chat/chat.service.ts)):**
     - Suporte nativo a envio de `document` (PDFs/DOCX), `image` (fotos/catálogos visuais) e `video` (vídeos de demonstração) com nome do arquivo customizado (`fileName`) e legenda comercial (`content`).
     - O destinatário no WhatsApp recebe o **arquivo real** aberto ou com botão de download nativo, nunca um link HTML de navegador.
  4. **Painel de Gestão e Cadastro do Catálogo ([QuickRepliesSettingsTab.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/components/settings/QuickRepliesSettingsTab.tsx)):**
     - Segmentação por abas/filtros: *Todos*, *PDFs / Catálogos*, *Fotos / Imagens*, *Vídeos* e *Textos Rápidos*.
     - Modal completo para cadastro rápido com seletor de tipo de material, atalho `/`, título, link do Google Drive com detector em tempo real, nome do arquivo no WhatsApp e legenda comercial.
     - Indicador visual `Google Drive (5 TB Nuvem)` em cada card, botão de cópia de atalho e atalho para abrir o arquivo original.
  5. **Atalho `/` no Chat do WhatsApp ([inbox/page.tsx](file:///c:/Users/Usuario/.gemini/antigravity-ide/scratch/VERSUS/frontend/src/app/(dashboard)/inbox/page.tsx)):**
     - Menu popup do `/` integrado com listagem dinâmica de catálogos e mídias cadastradas.
     - Badges semânticos coloridos: `[PDF NATIVO]` (rosa/vermelho), `[FOTO NATIVA]` (roxo), `[VÍDEO NATIVO]` (esmeralda) e exibição do nome do arquivo.
     - Ao clicar ou selecionar com Enter um item de catálogo/mídia, o sistema faz o disparo direto do arquivo para o WhatsApp do cliente via API e insere a mensagem na conversa com feedback de toast imediato.

---

### [PENDENTE] 05. Metas Comerciais de Equipe e Clientes em Reais (R$)
- **Status:** Pendente
- **Descrição:** Definição de metas financeiras individuais e coletivas em reais com tracking de performance e projeção comercial.

---

### [CONCLUÍDO] 06. API Pública e Webhook de Tráfego Pago (Meta Ads -> CRM)
- **Status:** Concluído (API Pública RESTful + Webhook seguro com Bearer token, ingestão ponta a ponta com criação de Deal no CRM e conversa no Inbox, normalização E.164, broadcast WebSocket em tempo real, disparo de automações, gestão de chaves em Configurações Gerais com exibição única de segurança, documentação interativa com exemplos cURL/JS/Python e simulador de leads ao vivo; TypeScript `tsc` código 0, NestJS `nest build` código 0).
- **Descrição:** Criação da infraestrutura corporativa de API Pública e Webhook para ingestão de leads diretamente de campanhas de tráfego pago (Meta Ads / Instagram Lead Ads / Facebook Ads, Google Ads, TikTok Ads, Typebot, Landing Pages, n8n, Make e Zapier) para o CRM e Inbox do VERSUS.
- **Recursos Entregues:**
  1. **Modelo de Banco de Dados (`ApiToken` via Prisma PostgreSQL):**
     - Armazenamento com `id`, `tenantId`, `name`, `token` único com hash e prefixo seguro (`vrs_live_...`), `tokenPrefix`, array de `permissions`, `isActive`, `lastUsedAt`, `createdBy`, `createdAt`, `updatedAt` e índices de alta performance.
     - Isolamento estrito por tenant.
  2. **Middlewares de Segurança e Whitelist:**
     - Rotas `/api/v1/public` e `/public-api` liberadas no `BotDetectorMiddleware` (evitando bloqueios indevidos de webhooks com User-Agents automatizados do Meta/Zapier/n8n).
     - Rota liberada de throttling restritivo de login no `RateLimiterMiddleware`.
  3. **Guarda de Autenticação Segura (`PublicApiKeyGuard`):**
     - Suporte a cabeçalhos padrão `Authorization: Bearer <TOKEN>` e `x-api-key: <TOKEN>`.
     - Validação instantânea de vigência do token, status do tenant e atualização assíncrona do carimbo `lastUsedAt`.
     - Injeção contextual de `req.tenantId` e `req.apiToken`.
  4. **Motor de Ingestão de Leads (`POST /api/v1/public/leads`):**
     - Normalização robusta de telefones para padrão E.164 (limpeza de caracteres, prefixo de país `+55` automático para números brasileiros).
     - Busca e atualização (upsert) transparente do contato (`Contact`).
     - Criação da oportunidade (`Deal`) no funil comercial desejado (respeitando `stage` e `funnel_id` informados ou selecionando o primeiro funil ativo da empresa).
     - Mapeamento completo de rastreamento de marketing: `source`, `campaign`, `ad_name`, `adset_name`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` e notas operacionais.
     - Criação ou reativação da conversa no Inbox oficial na fila de `waiting` (Aguardando Atendimento) com metadados do lead.
     - Broadcast em tempo real via WebSocket (`chatGateway.server.emit('dealCreated')`, `emit('conversationUpdated')`) para atualização de contadores e Kanban sem refresh.
     - Integração com o motor de automações (`automationsService.evaluateEvent`) para disparo de regras de boas-vindas e distribuição de leads.
  5. **Endpoints Auxiliares da API Pública:**
     - `GET /api/v1/public/funnels`: Listagem dos funis e etapas da empresa para mapeamento no formulário ou ferramenta de automação.
     - `GET /api/v1/public/users`: Listagem dos colaboradores para atribuição automática (`assigned_to`).
     - `POST /api/v1/public/deals` e `POST /api/v1/public/contacts`: Endpoints REST granulares para integrações personalizadas.
     - `GET /api/v1/public/health`: Endpoint de verificação rápida de status e conectividade.
  6. **Gestão de Chaves de Acesso (`ApiTokensController` & `ApiTokensService`):**
     - Endpoints protegidos por JWT corporativo para administradores gerenciarem credenciais (`GET /api-tokens`, `POST /api-tokens`, `PATCH /api-tokens/:id/toggle`, `DELETE /api-tokens/:id`).
     - Geração criptográfica segura via `crypto.randomBytes(24)` com prefixo identificador `vrs_live_`.
  7. **Interface Gráfica em Configurações Gerais (`/settings?tab=api`):**
     - Nova aba "APIs e Webhooks" integrada ao menu corporativo de parametrizações com ícone `KeyRound`.
     - **Sub-aba 1: Tokens de Acesso:**
       - Tabela com listagem de chaves ativas/inativas, data de criação e último uso.
       - Modal de criação de token com exibição única e destacada do Bearer token completo (padrão GitHub/Stripe/Lero) com botão de cópia em 1 clique e alerta de segurança.
       - Ativação/desativação instantânea (toggle) e revogação/exclusão com modal de confirmação.
     - **Sub-aba 2: Documentação Interativa & Webhook de Tráfego:**
       - URL Base copiável para o ambiente de produção.
       - Passo a passo visual em 3 etapas para o gestor de tráfego conectar formulários do Facebook/Instagram Lead Ads.
       - Tabela descritiva de todos os parâmetros aceitos no payload.
       - Seletor de exemplos de código com cópia em 1 clique: cURL, JavaScript (Fetch), Python (Requests) e Payload JSON completo.
       - Documentação dos endpoints auxiliares com respostas simuladas.
     - **Sub-aba 3: Simulador de Leads:**
       - Formulário visual em tempo real para disparar um lead de teste direto para a API e inspecionar a resposta HTTP e o JSON retornado sem sair do sistema.
     - Suporte nativo aos 3 temas da plataforma (WhatsApp `#00A884`, Dark Corporativo e Clean/Light).

