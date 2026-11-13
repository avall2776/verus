const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFICAÇÃO FINAL DA FILA E DO CASO THIAGO ===');

  // 1. Thiago Castilho
  const tc = await prisma.contact.findFirst({
    where: { phone: '5518997777766' },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        }
      }
    }
  });

  console.log('Thiago Castilho:', {
    id: tc?.id,
    name: tc?.name,
    phone: tc?.phone,
    lid: tc?.whatsappLid,
    hasAvatar: !!tc?.avatarUrl,
    convStatus: tc?.conversations[0]?.status,
    convUpdatedAt: tc?.conversations[0]?.updatedAt,
    messagesCount: tc?.conversations[0]?.messages?.length,
    latestMsg: tc?.conversations[0]?.messages[0]?.content
  });

  // 2. Thiago Antigo
  const ta = await prisma.contact.findFirst({
    where: { phone: '555492734866' },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        }
      }
    }
  });

  console.log('\nThiago Antigo:', {
    id: ta?.id,
    name: ta?.name,
    phone: ta?.phone,
    lid: ta?.whatsappLid,
    convStatus: ta?.conversations[0]?.status,
    convUpdatedAt: ta?.conversations[0]?.updatedAt,
    messagesCount: ta?.conversations[0]?.messages?.length,
    latestMsg: ta?.conversations[0]?.messages[0]?.content
  });

  // 3. Primeiras 5 conversas na fila geral de Verto
  const vertoId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const topConvs = await prisma.conversation.findMany({
    where: { tenantId: vertoId },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: { contact: true }
  });

  console.log('\nTop 5 conversas gerais por updatedAt:');
  for (const c of topConvs) {
    console.log(`  - [${c.updatedAt.toISOString()}] (${c.status}) ${c.contact?.name} (${c.contact?.phone})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

