require('dotenv').config();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const secret = process.env.JWT_SECRET || 'super-secret-key-change-me';
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function testRoute(token, name, url, method = 'GET', body = null) {
  const start = Date.now();
  try {
    const opts = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${url}`, opts);
    const duration = Date.now() - start;
    const ok = res.status >= 200 && res.status < 300;
    console.log(`[${ok ? 'PASS' : 'STATUS ' + res.status}] ${name.padEnd(30)} -> Tempo: ${duration}ms (< 500ms: ${duration < 500 ? '✅ SIM' : '❌ NÃO'})`);
    return { name, duration, success: ok, status: res.status };
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`[FAIL] ${name.padEnd(30)} -> Erro: ${err.message} (${duration}ms)`);
    return { name, duration, success: false, error: err.message };
  }
}

async function run() {
  try {
    console.log('\n===============================================================');
    console.log('  TESTE CIRÚRGICO FASE 1: PERFORMANCE ROTAS SUPER ADMIN (< 500ms)');
    console.log('===============================================================\n');

    const superAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { isSuperAdmin: true },
          { role: 'SUPER_ADMIN' },
          { role: 'ADMIN' },
        ],
      },
    });

    if (!superAdmin) {
      console.error('Nenhum usuário admin encontrado para o teste.');
      return;
    }

    const token = jwt.sign(
      {
        sub: superAdmin.id,
        id: superAdmin.id,
        userId: superAdmin.id,
        email: superAdmin.email,
        role: 'SUPER_ADMIN',
        isSuperAdmin: true,
        tenantId: superAdmin.tenantId,
      },
      secret,
      { expiresIn: '1h' }
    );

    console.log(`👤 Admin Identificado: ${superAdmin.email} | Tenant: ${superAdmin.tenantId}\n`);

    // Rodada 1: Carga Inicial
    console.log('--- Rodada 1: Carga Inicial ---');
    await testRoute(token, 'Stats Overview', '/tenants/stats/overview');
    await testRoute(token, 'List Tenants (Page 1)', '/tenants?limit=10&page=1');
    await testRoute(token, 'List Workspaces', '/workspaces');
    await testRoute(token, 'Metrics Dashboard', '/metrics/dashboard');

    // Rodada 2: Alternância de Abas (Com Cache em Memória)
    console.log('\n--- Rodada 2: Alternância de Abas (Cache em Memória) ---');
    await testRoute(token, 'Stats Overview (Cached)', '/tenants/stats/overview');
    await testRoute(token, 'List Tenants (Cached)', '/tenants?limit=10&page=1');
    await testRoute(token, 'List Workspaces (Repeat)', '/workspaces');
    await testRoute(token, 'Metrics Dashboard (Repeat)', '/metrics/dashboard');

    console.log('\n===============================================================\n');
  } catch (e) {
    console.error('Erro na execução do teste:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
