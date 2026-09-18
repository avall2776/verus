# 🚀 VERSUS - Omnichannel AI Platform Tracker

Este arquivo serve como mapa central do desenvolvimento do sistema VERSUS.
**Regra do Agente:** O agente (IA) DEVE atualizar este arquivo automaticamente ao concluir marcos importantes.

## 📌 Status Atual do Projeto
- **Fase Atual:** Fase 81 (Infraestrutura de Telefonia VoIP Proprietária, Softphone WebAudio & Produtos / Roadmap - 18/09/2026).
- **Última Entrega:** Fase 81 Concluída & Deployada com Sucesso (Motor VoIP NestJS, Softphone WebAudio DTMF ITU-T Q.23, Subseção Produtos/Roadmap na Engenharia e Hardening de Segurança VPS).
- **Status Operacional:** Aguardando formalização da contratação e inserção de créditos pré-pagos no Tronco SIP (Direct Call) para inserção de credenciais finais e homologação de chamadas reais.

---

## 📋 Checklist de Desenvolvimento

### 🎨 Fase 1: Fundação Frontend (Next.js)
- [x] Inicialização do Next.js e TailwindCSS
- [x] Configuração de PWA (Progressive Web App)
- [x] Configuração do Design System (Cores Dark Modern: #0B1224, #0055FF, #00D2FF)
- [x] Tela de Login (Glassmorphism Holográfico + Oceano de Dados 3D)
- [x] Layout Dashboard (Sidebar Modular + Topbar com Spotlight)
- [x] Interface da Caixa de Entrada (Inbox / Livechat)
- [x] Interface do Pipeline CRM (Kanban de Leads)
- [x] Interface de Configurações do Agente IA (Vitor)
- **⚠️ PENDÊNCIA FUTURA:** Definir modelo de vendas (Consultivo vs Self-Service). Se for self-service, será necessário voltar ao frontend para criar a Landing Page e a tela de `/register`.

### ⚙️ Fase 2: Infraestrutura Backend (NestJS)
- [x] Inicialização do Framework NestJS
- [x] Integração Básica OpenAI (Geração de Leads via Prompt)
- [ ] **[PRIORIDADE]** Sistema de Filas com Redis + BullMQ (Para evitar timeouts da IA)
- [ ] Configuração do Banco de Dados (Prisma ORM + PostgreSQL)
- [ ] Autenticação Real (JWT) integrando o Frontend com o Backend

### 🔌 Fase 3: Comunicação & Omnichannel
- [ ] Integração WhatsApp (Baileys ou Evolution API / API Oficial)
- [ ] Lógica de Handover (Transferência de conversa da IA para o Atendente Humano)
- [ ] Conexão Webhooks e disparo de eventos

### 🚀 Fase 4: Deploy & Produção
- [ ] Deploy Frontend na Vercel
- [ ] Configuração e Deploy Backend em VPS
- [ ] Monitoramento e Domínio Customizado
