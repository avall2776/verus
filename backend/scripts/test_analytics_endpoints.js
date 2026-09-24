const axios = require('axios');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

async function testAnalytics() {
  const user = await prisma.user.findFirst({
    where: { email: 'admin@versus.com' },
    include: { tenant: true }
  });

  if (!user) {
    console.error('No user found');
    return;
  }

  console.log('Testing with User:', user.name, 'tenantId:', user.tenantId);

  const token = jwt.sign(
    {
      sub: user.id,
      userId: user.id,
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      isSuperAdmin: Boolean(user.isSuperAdmin || user.role === 'SUPER_ADMIN')
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  const client = axios.create({
    baseURL: 'http://187.127.10.166:3001',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-target-tenant-id': user.tenantId,
      'x-tenant-id': user.tenantId
    }
  });

  const now = new Date();
  const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startDate = past.toISOString().split('T')[0];
  const endDate = now.toISOString().split('T')[0];
  const params = `startDate=${startDate}&endDate=${endDate}`;

  const endpoints = [
    `/analytics/overview?${params}`,
    `/analytics/charts?${params}`,
    `/analytics/agent-performance?${params}`,
    `/analytics/ai-costs?${params}`,
    `/analytics/csat?${params}`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await client.get(ep);
      console.log(`✓ [${res.status}] GET ${ep}: OK (${JSON.stringify(res.data).substring(0, 100)}...)`);
    } catch (err) {
      console.error(`✗ [${err.response?.status || 'ERR'}] GET ${ep}:`, err.response?.data || err.message);
    }
  }

  await prisma.$disconnect();
}

testAnalytics().catch(console.error);
