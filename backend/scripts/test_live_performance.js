const axios = require('axios');
const jwt = require('jsonwebtoken');
const { performance } = require('perf_hooks');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

async function testEndpoint(label, url, headers) {
  const t0 = performance.now();
  try {
    const res = await axios.get(url, { headers, timeout: 20000 });
    const dt = performance.now() - t0;
    const len = Array.isArray(res.data) ? res.data.length : (typeof res.data === 'object' ? Object.keys(res.data).length : String(res.data).length);
    console.log(`  ✓ [${dt.toFixed(0)}ms] ${label} (HTTP ${res.status}, items/keys: ${len})`);
    return { dt, ok: true, data: res.data };
  } catch (err) {
    const dt = performance.now() - t0;
    console.log(`  ✗ [${dt.toFixed(0)}ms] ${label} ERROR: ${err.response?.status || err.message}`);
    return { dt, ok: false, error: err };
  }
}

async function main() {
  const user = await prisma.user.findFirst({
    include: { tenant: true }
  });

  if (!user) {
    console.error('No user found');
    return;
  }

  const token = jwt.sign(
    {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      isSuperAdmin: Boolean(user.isSuperAdmin || user.role === 'SUPER_ADMIN')
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  const headers = {
    Authorization: `Bearer ${token}`,
    'x-tenant-id': user.tenantId,
  };

  console.log(`Testing with User: ${user.name} (${user.email}), Tenant: ${user.tenant?.name} (${user.tenantId})`);

  console.log('\n========================================');
  console.log('1. TESTING DIRECT VPS (http://187.127.10.166:3001)');
  console.log('========================================');
  const baseVps = 'http://187.127.10.166:3001';
  await testEndpoint('GET /users/me', `${baseVps}/users/me`, headers);
  const convRes = await testEndpoint('GET /conversations?tab=waiting', `${baseVps}/conversations?tab=waiting`, headers);
  await testEndpoint('GET /conversations/counts', `${baseVps}/conversations/counts`, headers);
  await testEndpoint('GET /notifications', `${baseVps}/notifications`, headers);
  await testEndpoint('GET /tenants/ai-status', `${baseVps}/tenants/ai-status`, headers);
  await testEndpoint('GET /contacts', `${baseVps}/contacts`, headers);

  if (convRes.ok && convRes.data.length > 0) {
    const firstConvId = convRes.data[0].id;
    await testEndpoint(`GET /conversations/${firstConvId}/messages`, `${baseVps}/conversations/${firstConvId}/messages`, headers);
  }

  console.log('\n========================================');
  console.log('2. TESTING VERCEL REWRITE PROXY (https://verus-alpha.vercel.app/api-backend)');
  console.log('========================================');
  const baseVercel = 'https://verus-alpha.vercel.app/api-backend';
  await testEndpoint('GET /users/me', `${baseVercel}/users/me`, headers);
  const vConvRes = await testEndpoint('GET /conversations?tab=waiting', `${baseVercel}/conversations?tab=waiting`, headers);
  await testEndpoint('GET /conversations/counts', `${baseVercel}/conversations/counts`, headers);
  await testEndpoint('GET /notifications', `${baseVercel}/notifications`, headers);
  await testEndpoint('GET /tenants/ai-status', `${baseVercel}/tenants/ai-status`, headers);
  await testEndpoint('GET /contacts', `${baseVercel}/contacts`, headers);

  if (vConvRes.ok && vConvRes.data.length > 0) {
    const firstConvId = vConvRes.data[0].id;
    await testEndpoint(`GET /conversations/${firstConvId}/messages`, `${baseVercel}/conversations/${firstConvId}/messages`, headers);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
