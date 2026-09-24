const { performance } = require('perf_hooks');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Testing Supabase DB round-trip latency...');
  const times = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    await prisma.user.findFirst();
    const dt = performance.now() - t0;
    times.push(dt);
    console.log(`Query ${i + 1}: ${dt.toFixed(1)} ms`);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`Average Query Latency: ${avg.toFixed(1)} ms`);

  console.log('\nTesting /conversations query pattern (findMany with joins):');
  const tStart = performance.now();
  const convs = await prisma.conversation.findMany({
    take: 20,
    include: {
      contact: true,
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  const tConv = performance.now() - tStart;
  console.log(`Fetched ${convs.length} conversations in ${tConv.toFixed(1)} ms`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
