require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const items = await prisma.quickReply.findMany({
    where: { tenantId },
    select: { shortcut: true, title: true, fileName: true, type: true, content: true },
  });

  const recognized = [
    'apresentacao', 'caixa_suspensa', 'caixa_no_cafe', 'escarificador', 'staras', 'absoluta',
    'princesa', 'db_43', '1113', 'momentum', 'pl_6000', 'pl6000', 'planticenter', 'civemasa',
    'ecoagricola', 'piccin', 'fire_stop', 'versatil_max', 'versatil_standard', 'versatiltractor',
    'demonstra', 'reels', 'video_para_trafego', 'seedpro', 'cadastro', 'adesivo'
  ];

  console.log('--- UNRECOGNIZED ITEMS ---');
  for (const it of items) {
    const hay = `${it.shortcut} ${it.title} ${it.fileName}`.toLowerCase();
    const isRec = recognized.some(r => hay.includes(r));
    if (!isRec) {
      console.log(`[${it.type}] ${it.shortcut.padEnd(35)} | ${it.title} | ${it.fileName}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

