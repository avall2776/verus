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

---

## 🚧 Próximos Passos (Backlog / O que falta fazer)

## 🛠️ Fase 7: O Coração da Operação (Integração e Controles do Atendente)
- [x] Integração da tela de Inbox para consumo real das mensagens via API. [2026-09-08 14:15]
- [x] Sincronização em Tempo Real (WebSockets) do Chat. [2026-09-08 15:30]
- [x] Persistência do Histórico do Chat ao Recarregar a Página (F5). [2026-09-09 09:20]
- [x] Controles de Transbordo (Handoff): Implementar botão de "Assumir Conversa". [2026-09-09 09:20]
- [x] Notificações Visuais de Novas Mensagens e Transbordo: Efeitos "Pulsar" e alertas no navegador para chamar a atenção imediata do atendente. [2026-09-09 10:15]
- [x] Painel CRM Kanban Dinâmico: Integrar Drag & Drop (`@hello-pangea/dnd`) com a API (`GET /deals` e `PATCH /deals/:id/status`) para exibição e evolução real das negociações qualificadas pela IA. [2026-09-09 09:37]

## 🛠️ Fase 8: Painel de Controle e Deploy Final
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

---

## 🎯 O que faremos amanhã (Roadmap Imediato)

### Fase 12: Unmocking Final e Escalonamento
- [x] **Unmocking do Playground (Agent Page):** Remover as mensagens estáticas do componente `Playground` e integrá-lo em tempo real para permitir que o dono da empresa converse com a IA simulando um lead real na tela de configurações. [2026-09-10 09:25]
- [x] **Otimização de Performance (Routing & Cache):** Diagnóstico e resolução de lentidão ao trocar de telas no frontend, com uso de SWR/React Query e Suspense. [2026-09-10 10:15]
- [x] **Integração Base de Conhecimento (RAG Avançado):** Evoluir a memória da IA. Criar uma interface para o cliente fazer upload de PDFs (ex: Tabela de Preços, Catálogos) e processar esses dados em um Vector Database (Pinecone/Supabase pgvector) para a IA ler. [2026-09-10 11:35]
- [ ] **Testes End-to-End (E2E):** Revisão completa de fluxo: Lead manda zap -> Cai no Dashboard -> Notifica Web -> IA responde -> Humano assume -> IA retoma.

---
*Documento autogerado e contínuo - Última atualização: 10/09/2026 às 13:40*

---

## 🚀 Roadmap Futuro (Icebox / Banco de Ideias)
*Esta seção armazena ideias arquiteturais avançadas e expansões de escopo para longo prazo. Não fazem parte da esteira atual de MVP/Produção.*

- [ ] **Onboarding Self-Service (Múltiplos Tenants & Sublogins):** Plataforma pública de cadastro. Novas empresas se cadastram via Stripe, geram banco isolado automaticamente, e o ADMIN gerencia "Sublogins" (Atendentes) com permissões limitadas (Apenas tela Inbox e CRM).
- [ ] **Voice AI Agent:** Robô de voz inteligente capaz de realizar ligações ativas (pré-venda/pós-venda) e receber ligações (receptivo) sem delay, integrado à base do CRM e OpenAI (Bland AI / Vapi).
- [ ] **Integração VoIP Nativa (WebRTC):** Permitir que o atendente humano realize chamadas de áudio e vídeo direto pelo navegador na tela de Inbox (Twilio/Vonage), com gravação e transcrição automática vinculada ao card do lead no CRM.
