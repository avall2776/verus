const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

// Felipe Costa - Agencia teste
const user = {
  id: '3a55f91c-cba8-482c-9d6e-d7978e42d54c',
  name: 'Felipe Costa',
  email: 'felipecostaprodutor@gmail.com',
  role: 'ADMIN',
  tenantId: 'c38f8968-ee21-437c-a1b5-f83d0307cb4b',
  isSuperAdmin: false
};

const token = jwt.sign(
  {
    sub: user.id,
    userId: user.id,
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role,
    isSuperAdmin: user.isSuperAdmin
  },
  JWT_SECRET,
  { expiresIn: '1d' }
);

const routesToTest = [
  // 1. Auth & Perfil
  { group: '1. Auth & Sessão', method: 'GET', url: '/users/me' },
  { group: '1. Auth & Sessão', method: 'GET', url: '/tenants/me' },
  { group: '1. Auth & Sessão', method: 'GET', url: '/tenants/ai-status' },
  { group: '1. Auth & Sessão', method: 'GET', url: '/notifications' },

  // 2. Operação / WhatsApp / Inbox
  { group: '2. Operação & Chat', method: 'GET', url: '/conversations?tab=waiting' },
  { group: '2. Operação & Chat', method: 'GET', url: '/conversations?tab=mine' },
  { group: '2. Operação & Chat', method: 'GET', url: '/conversations?tab=all' },
  { group: '2. Operação & Chat', method: 'GET', url: '/conversations/counts' },
  { group: '2. Operação & Chat', method: 'GET', url: '/contacts' },

  // 3. Métricas de Atendimento (Suíte de Análise)
  { group: '3. Métricas de Atendimento', method: 'GET', url: '/analytics/overview?startDate=2026-09-17&endDate=2026-09-24' },
  { group: '3. Métricas de Atendimento', method: 'GET', url: '/analytics/charts?startDate=2026-09-17&endDate=2026-09-24' },
  { group: '3. Métricas de Atendimento', method: 'GET', url: '/analytics/agent-performance?startDate=2026-09-17&endDate=2026-09-24' },
  { group: '3. Métricas de Atendimento', method: 'GET', url: '/analytics/ai-costs?startDate=2026-09-17&endDate=2026-09-24' },
  { group: '3. Métricas de Atendimento', method: 'GET', url: '/analytics/csat?startDate=2026-09-17&endDate=2026-09-24' },

  // 4. Funil Comercial (CRM) & Métricas de Vendas
  { group: '4. CRM & Vendas', method: 'GET', url: '/metrics/crm' },
  { group: '4. CRM & Vendas', method: 'GET', url: '/deals' },
  { group: '4. CRM & Vendas', method: 'GET', url: '/deals/users' },

  // 5. Configurações & Equipe
  { group: '5. Configurações', method: 'GET', url: '/users' },
  { group: '5. Configurações', method: 'GET', url: '/departments' },
  { group: '5. Configurações', method: 'GET', url: '/quick-replies' },

  // 6. Automações & Gatilhos
  { group: '6. Automações', method: 'GET', url: '/automations' },

  // 7. Chamados de Suporte
  { group: '7. Suporte', method: 'GET', url: '/support/tickets' },

  // 8. Metas Comerciais
  { group: '8. Metas', method: 'GET', url: '/goals' }
];

async function runAudit(baseUrl, label) {
  console.log(`\n======================================================`);
  console.log(`AUDITANDO: ${label} (${baseUrl})`);
  console.log(`Usuário: ${user.name} | Tenant: Agencia teste (${user.tenantId})`);
  console.log(`======================================================`);

  const client = axios.create({
    baseURL: baseUrl,
    headers: {
      Authorization: `Bearer ${token}`,
      'x-target-tenant-id': user.tenantId,
      'x-tenant-id': user.tenantId,
      Accept: 'application/json'
    },
    timeout: 15000
  });

  let pass = 0;
  let fail = 0;
  let currentGroup = '';

  for (const r of routesToTest) {
    if (r.group !== currentGroup) {
      currentGroup = r.group;
      console.log(`\n[${currentGroup}]`);
    }

    const t0 = Date.now();
    try {
      const res = await client({ method: r.method, url: r.url });
      const dt = Date.now() - t0;
      const count = Array.isArray(res.data) ? `${res.data.length} itens` : typeof res.data === 'object' ? `${Object.keys(res.data).length} chaves` : 'ok';
      console.log(`  ✓ [HTTP ${res.status}] (${dt}ms) ${r.method} ${r.url} -> ${count}`);
      pass++;
    } catch (err) {
      const dt = Date.now() - t0;
      const status = err.response?.status || 'FAIL';
      const msg = err.response?.data?.message || err.message;
      console.error(`  ✗ [HTTP ${status}] (${dt}ms) ${r.method} ${r.url} -> ERROR: ${JSON.stringify(msg)}`);
      fail++;
    }
  }

  console.log(`\nResultado ${label}: ${pass} rotas OK, ${fail} rotas com erro.`);
  return { pass, fail };
}

async function main() {
  await runAudit('https://verus-alpha.vercel.app/api-backend', 'PRODUÇÃO VERCEL PROXY');
  await runAudit('http://187.127.10.166:3001', 'DIRETO VPS');
}

main().catch(console.error);
