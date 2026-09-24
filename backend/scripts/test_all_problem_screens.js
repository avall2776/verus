const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

async function testAllScreens() {
  const token = jwt.sign(
    {
      sub: '43ebc18a-9e11-4091-872f-5b61fa25dca9', // Admin VERSUS ID
      userId: '43ebc18a-9e11-4091-872f-5b61fa25dca9',
      id: '43ebc18a-9e11-4091-872f-5b61fa25dca9',
      email: 'admin@versus.com',
      tenantId: 'tenant_123',
      role: 'SUPER_ADMIN',
      isSuperAdmin: true
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  const client = axios.create({
    baseURL: 'https://verus-alpha.vercel.app/api-backend',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-target-tenant-id': 'tenant_123',
      'x-tenant-id': 'tenant_123'
    }
  });

  const now = new Date();
  const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startDate = past.toISOString().split('T')[0];
  const endDate = now.toISOString().split('T')[0];
  const params = `startDate=${startDate}&endDate=${endDate}`;

  console.log('--- 1. TESTANDO MÉTRICAS DE ATENDIMENTO (/dashboard/atendimento) ---');
  const atendimentoEps = [
    `/analytics/overview?${params}`,
    `/analytics/charts?${params}`,
    `/analytics/agent-performance?${params}`,
    `/analytics/ai-costs?${params}`,
    `/analytics/csat?${params}`,
  ];
  for (const ep of atendimentoEps) {
    try {
      const res = await client.get(ep);
      console.log(`  ✓ [HTTP ${res.status}] GET ${ep}`);
    } catch (err) {
      console.error(`  ✗ [HTTP ${err.response?.status || 'ERR'}] GET ${ep}:`, err.response?.data || err.message);
    }
  }

  console.log('\n--- 2. TESTANDO MÉTRICAS DE VENDAS (/dashboard/crm) ---');
  const crmEps = [
    '/metrics/crm',
    '/deals',
    '/deals/users'
  ];
  for (const ep of crmEps) {
    try {
      const res = await client.get(ep);
      console.log(`  ✓ [HTTP ${res.status}] GET ${ep}`);
    } catch (err) {
      console.error(`  ✗ [HTTP ${err.response?.status || 'ERR'}] GET ${ep}:`, err.response?.data || err.message);
    }
  }

  console.log('\n--- 3. TESTANDO CONFIGURAÇÕES DO SISTEMA (/settings) ---');
  const settingsEps = [
    '/tenants/me',
    '/users/me'
  ];
  for (const ep of settingsEps) {
    try {
      const res = await client.get(ep);
      console.log(`  ✓ [HTTP ${res.status}] GET ${ep}`);
    } catch (err) {
      console.error(`  ✗ [HTTP ${err.response?.status || 'ERR'}] GET ${ep}:`, err.response?.data || err.message);
    }
  }
}

testAllScreens().catch(console.error);
