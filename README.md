# 🚀 PROJETO VERUS — Plataforma SaaS de IA & Atendimento Omnichannel

Transformação do MVP/n8n em uma **Plataforma Comercial de IA Segura, Escalável e Vendável (SaaS)** com motor próprio em Node.js/TypeScript, integração oficial com Meta Cloud API (WhatsApp), Base de Conhecimento RAG, Trava de Handoff (IA vs. Humano) e PWA para vendedores.

---

## 🏗️ Visão Geral da Arquitetura

O sistema é dividido em duas frentes fundamentais:

```
versus/
├── backend/                  # Motor Próprio (Node.js / TypeScript / NestJS)
│   ├── src/
│   │   ├── config/           # Configurações de ambiente, Meta API, OpenAI, Redis
│   │   ├── modules/
│   │   │   ├── ai-engine/    # Motor de IA (OpenAI, Prompts, Agentes)
│   │   │   ├── handoff/      # 🔒 Trava de Handoff (Anti-colisão IA vs. Humano)
│   │   │   ├── whatsapp/     # Integração Oficial Meta Cloud API (Webhooks, Envio)
│   │   │   ├── rag/          # Base de Conhecimento (Chunking, Embeddings, Busca Vetorial)
│   │   │   ├── inbox/        # Caixa de entrada Omnichannel (WebSockets em tempo real)
│   │   │   ├── crm/          # Gestão de Leads e Funil de Vendas (Pipeline)
│   │   │   ├── tenants/      # Multi-tenancy (Isolamento total de dados por cliente)
│   │   │   ├── auth/         # Autenticação JWT, Perfis e Permissões (RBAC)
│   │   │   └── billing/      # Controle de Planos, Limites de Mensagens e Tokens
│   │   └── shared/
│   │       ├── database/     # Prisma ORM + PostgreSQL (pgvector)
│   │       ├── storage/      # S3 / MinIO / Object Storage para PDFs e Manuais
│   │       └── middlewares/  # Rate limiting, Auth Guard, Tenant Guard, LGPD audit
├── frontend/                 # Aplicativo & Painel Web (Next.js / PWA / Tailwind)
│   ├── public/               # Ícones, Assets e manifest.json (PWA para vendedores)
│   └── src/
│       ├── app/
│       │   ├── (auth)/       # Login, Cadastro, Recuperação de Acesso
│       │   └── (dashboard)/
│       │       ├── dashboard/       # Métricas de Atendimento e Conversão
│       │       ├── inbox/           # Caixa de Entrada Omnichannel em Tempo Real
│       │       ├── crm/             # Funil de Vendas Kanban e Gestão de Leads
│       │       ├── knowledge-base/  # Upload e Gestão de PDFs/Tabelas (RAG)
│       │       ├── agent-settings/  # Persona, Prompt Mestre, Gatilhos da IA
│       │       └── settings/        # WhatsApp Oficial, Equipe e Faturamento
│       ├── components/       # Componentes modulares UI
│       └── services/         # Clientes de API e Sockets
├── docs/                     # Documentação de Arquitetura, WhatsApp Meta e LGPD
└── docker-compose.yml        # PostgreSQL (com pgvector) + Redis + MinIO local
```

---

## 📋 Fases de Desenvolvimento (Cronograma)

- **Fase 1: O "Motor" e o Banco de Dados (Backend)**
  - Banco de Dados PostgreSQL multi-tenant com isolamento seguro por cliente.
  - API própria em Node.js/TypeScript migrando a lógica do WhatsApp e IA do n8n.
  - Implementação da **Trava de Handoff** (IA desativa imediatamente quando atendente assume).
- **Fase 2: O Visual e Aplicativo (Frontend / PWA)**
  - Painel visual completo: Dashboard, Caixa de Entrada (Inbox), CRM e Configuração do Agente.
  - Instalação PWA no desktop e celular dos vendedores.
- **Fase 3: Inteligência (Base de Conhecimento RAG)**
  - Upload de PDFs, tabelas de preços e manuais com extração de texto e embeddings vetoriais.
- **Fase 4: Testes de Produção (Go-Live)**
  - Pentest básico, estresse de mensagens simultâneas e lançamento seguro.

---

## ⚡ Como Rodar o Ambiente Local

### 1. Subir Infraestrutura (PostgreSQL + pgvector, Redis, MinIO)
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
npm install
cp ../.env.example .env
npx prisma migrate dev
npm run dev
```

### 3. Frontend (PWA)
```bash
cd frontend
npm install
npm run dev
```
