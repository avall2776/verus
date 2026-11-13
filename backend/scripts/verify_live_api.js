const axios = require('axios');
const jwt = require('jsonwebtoken');

const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
const jwtSecret = process.env.JWT_SECRET || 'supersecret';

// Cria um token válido para o usuário do tenant Verto
const token = jwt.sign(
  {
    sub: 'user_verto_admin',
    id: 'user_verto_admin',
    email: 'admin@verto.com.br',
    tenantId,
    role: 'ADMIN',
  },
  jwtSecret,
  { expiresIn: '1h' }
);

async function testEndpoints() {
  const baseURL = 'http://187.127.10.166:3001';
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  console.log('--- TESTANDO ROTAS DO RADAR DE STORIES NO BACKEND VPS ---');

  try {
    const postsRes = await axios.get(`${baseURL}/crm/radar-stories/posts`, { headers });
    console.log(`[GET /crm/radar-stories/posts] Retornou ${postsRes.data?.length || 0} posts ativos:`);
    console.log(JSON.stringify(postsRes.data, null, 2));
  } catch (e) {
    console.error('Erro em /posts:', e.response?.data || e.message);
  }

  try {
    const metricsRes = await axios.get(`${baseURL}/crm/radar-stories/metrics`, { headers });
    console.log('\n[GET /crm/radar-stories/metrics] KPIs:');
    console.log(metricsRes.data?.kpis);
  } catch (e) {
    console.error('Erro em /metrics:', e.response?.data || e.message);
  }

  try {
    const viewersRes = await axios.get(`${baseURL}/crm/radar-stories/viewers`, { headers });
    console.log(`\n[GET /crm/radar-stories/viewers] Retornou ${viewersRes.data?.length || 0} visualizadores auditados.`);
    if (viewersRes.data && viewersRes.data.length > 0) {
      console.log('Primeiro visualizador:', viewersRes.data[0]);
    }
  } catch (e) {
    console.error('Erro em /viewers:', e.response?.data || e.message);
  }
}

testEndpoints();
