const { performance } = require('perf_hooks');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testPool(url, label) {
  console.log(`\n--- Testing ${label} ---`);
  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });

  try {
    const t0 = performance.now();
    await prisma.$connect();
    console.log(`Connection established in ${(performance.now() - t0).toFixed(1)}ms`);

    const times = [];
    for (let i = 0; i < 3; i++) {
      const qStart = performance.now();
      await prisma.user.findFirst();
      times.push(performance.now() - qStart);
    }
    console.log(`Warm queries: ${times.map(t => t.toFixed(1) + 'ms').join(', ')}`);
  } catch (err) {
    console.log(`Failed: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const currentUrl = process.env.DATABASE_URL;
  await testPool(currentUrl, 'Current Pooler (:6543 pgbouncer=true)');

  // Try direct connection without pgbouncer (port 5432)
  const directUrl = currentUrl.replace(':6543', ':5432').replace('?pgbouncer=true', '').replace('&pgbouncer=true', '');
  await testPool(directUrl, 'Direct Connection (:5432)');

  // Try pooler with connection_limit
  const tunedPooler = currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'connection_limit=20&pool_timeout=10';
  await testPool(tunedPooler, 'Tuned Pooler (:6543 connection_limit=20)');
}

main().catch(console.error);
