const { performance } = require('perf_hooks');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function test(url, label) {
  console.log(`\n=== Testing: ${label} ===`);
  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });

  try {
    const t0 = performance.now();
    await prisma.$connect();
    console.log(`Connected in ${(performance.now() - t0).toFixed(1)}ms`);

    const times = [];
    for (let i = 0; i < 4; i++) {
      const qStart = performance.now();
      await prisma.conversation.findMany({
        take: 20,
        include: {
          contact: true,
          messages: { take: 1, orderBy: { createdAt: 'desc' } }
        }
      });
      times.push(performance.now() - qStart);
    }
    console.log(`20 Conversations with joins: ${times.map(t => t.toFixed(1) + 'ms').join(', ')}`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const current = process.env.DATABASE_URL;
  await test(current, '1. Current (Pooler :6543 pgbouncer=true)');

  const pooler5432 = current.replace(':6543', ':5432').replace('?pgbouncer=true', '').replace('&pgbouncer=true', '');
  await test(pooler5432, '2. Session Pooler (:5432)');

  const poolerWithParams = pooler5432 + (pooler5432.includes('?') ? '&' : '?') + 'connection_limit=15&pool_timeout=15';
  await test(poolerWithParams, '3. Session Pooler (:5432 connection_limit=15)');
}

run().catch(console.error);
