# 🛡️ Diretrizes de Adequação LGPD e Segurança

## 1. Eliminação do Scraping Não Autorizado
- **Risco Anterior**: Uso do Apify para raspagem no Instagram/Google Maps gerava risco direto de bloqueio de contas e sanções da LGPD por captação sem consentimento.
- **Diretriz Nova**: Prospecção e aquisição de leads exclusivamente via canais oficiais (Meta Cloud API, tráfego pago, formulários de captura com consentimento explícito e opt-in).

## 2. Isolamento Multi-Tenancy
- Cada cliente (empresa/tenant) possui seus dados, conversas, leads e base de conhecimento isolados por chaves estrangeiras (`tenantId`) e políticas de acesso (Row Level Security / Tenant Middleware).
- Uma empresa nunca tem acesso ao histórico ou documentos de outra.

## 3. Retenção e Expurgamento
- Armazenamento seguro de logs com anonimização sob demanda (direito ao esquecimento previsto na LGPD).
- Manutenção de trilha de auditoria para ações executadas por atendentes e robôs de IA.
