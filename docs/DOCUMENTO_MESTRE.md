# ESPECIFICAÇÃO DE PRODUTO E PLANO MESTRE DE DESENVOLVIMENTO — PLATAFORMA VERSUS

## 1. VISÃO DO PRODUTO E OBJETIVO COMERCIAL
Construção de uma plataforma própria, proprietária e comercial (B2B SaaS) voltada para atendimento conversacional inteligente, qualificação de leads e gestão comercial via WhatsApp.
O sistema deve substituir integralmente arquiteturas frágeis baseadas em no-code/automações de terceiros, oferecendo isolamento multitenant, alta performance, segurança de nível empresarial e estrita conformidade legal.

---

## 2. DIRETRIZES TÉCNICAS E LIMITES INEGOCIÁVEIS (GOVERNANÇA)
1. **Descarte Integral do n8n:** Não utilizar nós ou fluxos do n8n como motor de produção devido a restrições de licença comercial (Sustainable Use License) para oferta direta a clientes e limitações de confiabilidade operacional.
2. **Descarte de Web Scraping (Apify/Selenium):** Proibida terminantemente a raspagem de dados não autorizada para prospecção, em atendimento irrestrito à LGPD (Lei nº 13.709/2018) e aos Termos de Serviço das plataformas.
3. **Uso Exclusivo de APIs Oficiais e Corporativas:** 
   - Provedor de Mensageria: Meta Cloud API oficial (e gateway homologado compatível).
   - Inteligência Artificial: OpenAI Platform via chave corporativa com garantia contratual formal de não retenção de dados de clientes para treinamento de modelos.
4. **Segregação Estrita de Ambientes:** Princípio de "Menor Privilégio". Toda requisição precisa ser autenticada e validada em escopo de tenant.

---

## 3. REGRA DE OURO OPERACIONAL: A TRAVA DE HANDOFF HUMANO
- A inteligência artificial **NUNCA** responde, interfere ou sobrescreve uma conversa quando um operador humano estiver no atendimento.
- **Máquina de Estados de Atendimento:** 
  - `bot_active`: O agente de IA processa e responde as mensagens.
  - `human_takeover`: A IA é sumariamente bloqueada. Qualquer envio automático de saída é interceptado e descartado.
  - `paused` / `resolved`: Estados transitórios de encerramento ou pausa manual.
- **Gatilho de Ativação Automática:** Se qualquer mensagem for enviada por um atendente cadastrado no painel, o estado da conversa migra imediatamente e compulsoriamente para `human_takeover`.
- A IA só retoma o atendimento caso o operador libere expressamente o chat pelo painel.

---

## 4. STACK TECNOLÓGICA PADRONIZADA
- **Backend:** Node.js com NestJS (TypeScript) estruturado de forma modular (REST APIs, WebSockets e filas).
- **Banco de Dados & Cache:** PostgreSQL (Supabase) com Row Level Security (RLS) mandatório e extensão `pgvector` para busca semântica (RAG). Redis com BullMQ para mensageria assíncrona e desacoplamento de carga.
- **Frontend / Interface:** Next.js (React) + Tailwind CSS configurado como PWA (Progressive Web App), otimizado para navegação mobile e desktop de operadores comerciais.
- **Infraestrutura:** VPS Hostinger (Ubuntu), conteinerizada via Docker e orquestrada com Docker Compose.

---

## 5. ROTEIRO CRÍTICO DE PROGRAMAÇÃO (ROADMAP DE SPRINT)

### Fase 1: Fundação de Dados e Multitenancy (PostgreSQL/Supabase)
- **1.1 Schema DDL:** Criação das tabelas centrais: `tenants`, `users`, `contacts`, `conversations`, `messages`, `deals`, `pipeline_stages`.
- **1.2 Isolamento RLS:** Implementação rigorosa de políticas de Row Level Security garantindo que cada tenant só enxergue seus próprios registros (`tenant_id`).
- **1.3 Base Vetorial (RAG) e Logs:** Habilitação do `pgvector`, tabela de embeddings para manuais e trilha de auditoria para conformidade LGPD.

### Fase 2: Backend Base e Arquitetura Modular (NestJS)
- **2.1 Setup & Configuração:** Inicialização do NestJS, validação de variáveis de ambiente com schemas estritos e ORM (Prisma/TypeORM).
- **2.2 Autenticação & Contexto Tenant:** Guards e interceptadores globais de JWT e tenant context para extrair o `tenant_id` em tempo de execução.
- **2.3 Filas Assíncronas:** Configuração de filas BullMQ/Redis (`webhook-ingress`, `ai-processing`, `message-egress`) para escalabilidade de eventos.

### Fase 3: Gateway de Mensageria (WhatsApp Inbound/Outbound)
- **3.1 Ingestão (Webhook Inbound):** Recebimento resiliente de payloads, validação de integridade, sanitização de dados, tratamento de idempotência e vinculação a contatos/sessões.
- **3.2 Despacho (Outbound):** Driver de envio unificado compatível com Meta Cloud API, gestão de status (`sent`, `delivered`, `read`) e taxa de envio.

### Fase 4: Motor de IA, RAG e Lógica de Transbordo
- **4.1 Interceptador de Handoff:** Bloqueador de chamadas de IA condicionado ao estado `bot_active`.
- **4.2 Ingestão RAG:** Conector OpenAI Platform, busca semântica por similaridade de cosseno em `pgvector` e montagem contextual do prompt com regras comerciais.
- **4.3 Qualificação Comercial:** Extração automática de dados do lead (interesse, orçamento) e atualização dinâmica de pipelines. Transbordo humano por baixa confiança ou intenção explícita.

### Fase 5: Interface do Operador e Painel (PWA)
- **5.1 Atendimento em Tempo Real:** Tela de mensageria com WebSocket para visualização e envio rápido pelo atendente.
- **5.2 Controles de Operação:** Ações de "Assumir Conversa", "Liberar para IA", gestão visual do funil comercial (Kanban) e gestão de base de conhecimento.

### Fase 6: Estabilização, Testes e Produção
- **6.1 Resiliência:** Testes de concorrência, mensagens duplicadas (debounce) e degradação suave perante indisponibilidades de API externa.
- **6.2 Deploy VPS:** `Dockerfile`, `docker-compose.yml`, proxy reverso seguro (HTTPS) e monitoramento estruturado de eventos de erro.
