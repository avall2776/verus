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

### [PENDENTE] 04. Upgrade do Atalho '/' (Catálogo de Arquivos/Produtos via Drive)
- **Status:** Pendente
- **Descrição:** Envio rápido de PDFs, fotos e materiais do catálogo corporativo diretamente através do atalho `/` no chat.

---

### [PENDENTE] 05. Metas Comerciais de Equipe e Clientes em Reais (R$)
- **Status:** Pendente
- **Descrição:** Definição de metas financeiras individuais e coletivas em reais com tracking de performance e projeção comercial.

---

### [PENDENTE] 06. API Pública e Webhook de Tráfego Pago (Meta Ads -> CRM)
- **Status:** Pendente
- **Descrição:** Endpoint seguro para ingestão de leads diretamente de campanhas de tráfego pago (Meta Ads / Webhooks externos) para o CRM.
