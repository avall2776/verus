require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const items = await prisma.quickReply.findMany({
    where: { tenantId },
    select: {
      id: true,
      shortcut: true,
      title: true,
      fileName: true,
      type: true,
      content: true,
      mediaUrl: true,
    },
    orderBy: { shortcut: 'asc' },
  });

  console.log(`Total: ${items.length}`);
  // Extract folder or product name from title (e.g. "2 Staras 44 e 40 linhas MT: WhatsApp Image...")
  const groups = {};
  for (const it of items) {
    let group = 'Outros';
    if (it.title && it.title.includes(':')) {
      group = it.title.split(':')[0].trim();
    } else if (it.title) {
      group = it.title.trim();
    }
    if (!groups[group]) groups[group] = [];
    groups[group].push(it);
  }

  console.log('\n--- PRODUCT / FOLDER GROUPS FOUND IN DATABASE ---');
  for (const [grp, list] of Object.entries(groups)) {
    const types = list.map(x => x.type);
    const docCount = types.filter(t => t === 'document').length;
    const imgCount = types.filter(t => t === 'image').length;
    const vidCount = types.filter(t => t === 'video').length;
    const txtCount = types.filter(t => t === 'text').length;
    console.log(`Group: "${grp}" => ${list.length} files (Img: ${imgCount}, Vid: ${vidCount}, Doc: ${docCount}, Txt: ${txtCount})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
