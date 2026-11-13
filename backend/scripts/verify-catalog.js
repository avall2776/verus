require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const replies = await prisma.quickReply.findMany({
    where: { tenantId },
    orderBy: { shortcut: 'asc' },
  });

  console.log(`Total Quick Replies in DB: ${replies.length}\n`);
  for (const r of replies) {
    let countBadge = '';
    if (r.mediaUrl && r.mediaUrl.startsWith('[')) {
      try {
        const files = JSON.parse(r.mediaUrl);
        const imgs = files.filter(f => f.type === 'image').length;
        const vids = files.filter(f => f.type === 'video').length;
        const docs = files.filter(f => f.type === 'document').length;
        const parts = [];
        if (imgs) parts.push(`${imgs} Fotos`);
        if (vids) parts.push(`${vids} Vídeos`);
        if (docs) parts.push(`${docs} PDFs`);
        countBadge = `[📎 ${parts.join(', ')}]`;
      } catch {}
    } else if (r.mediaUrl) {
      countBadge = `[📎 1 ${r.type}]`;
    }
    console.log(`${r.shortcut.padEnd(20)} | ${r.title.padEnd(30)} ${countBadge.padEnd(25)} | "${r.content.substring(0, 50)}"`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

