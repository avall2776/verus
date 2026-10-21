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

### [PENDENTE] 03. Departamentos e Associação Direta de Usuários
- **Status:** Pendente
- **Descrição:** Associação direta de operadores e usuários a múltiplos departamentos com filtragem no chat e distribuição de atendimentos.

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
