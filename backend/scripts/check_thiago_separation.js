const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFICANDO SEPARAÇÃO E DESVIO DE MENSAGENS RECENTES ===');

  // 1. Caso do Thiago Castilho
  const thiagoMsg = await prisma.message.findFirst({
    where: { content: { contains: 'Semeadora Verona' } },
    include: { contact: true, conversation: true }
  });
  console.log('Mensagem Semeadora Verona hoje:', {
    id: thiagoMsg?.id,
    content: thiagoMsg?.content?.substring(0, 50),
    createdAt: thiagoMsg?.createdAt,
    contactId: thiagoMsg?.contactId,
    contactName: thiagoMsg?.contact?.name,
    contactPhone: thiagoMsg?.contact?.phone,
    convId: thiagoMsg?.conversationId
  });

  // 2. Verifica o contato Thiago Castilho
  const castilho = await prisma.contact.findFirst({
    where: {
      OR: [
        { phone: { contains: '997777766' } },
        { name: { contains: 'Castilho', mode: 'insensitive' } }
      ]
    },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      }
    }
  });

  console.log('\nContato Thiago Castilho no CRM:', {
    id: castilho?.id,
    name: castilho?.name,
    phone: castilho?.phone,
    lid: castilho?.whatsappLid,
    convs: castilho?.conversations?.map(c => ({
      id: c.id,
      status: c.status,
      assignedTo: c.assignedToId,
      messages: c.messages.map(m => ({ id: m.id, content: m.content?.substring(0, 40) }))
    }))
  });

  // 3. Verifica as últimas 10 mensagens na conversa do Thiago Antigo (555492734866)
  const thiagoAntigoConv = await prisma.conversation.findUnique({
    where: { id: '0e32a6b4-51cb-42d6-aa1d-ba3a85b9de4c' },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 6
      }
    }
  });

  console.log('\nÚltimas mensagens na conversa do Thiago Antigo:');
  for (const m of thiagoAntigoConv?.messages || []) {
    console.log(`  [${m.createdAt.toISOString()}] (id: ${m.id}) ${m.content?.substring(0, 60)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

