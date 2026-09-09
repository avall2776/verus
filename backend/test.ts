import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const tenantId = 'tenant_123';
  const phone = '5511988887777';
  const messageId = 'wamid.HBgLNTUxMTk5OT...';

  try {
    const existingMessage = await prisma.message.findUnique({
      where: { tenantId_providerMessageId: { tenantId, providerMessageId: messageId } }
    });
    console.log('findUnique success:', !!existingMessage);

    const contact = await prisma.contact.upsert({
      where: { tenantId_phone: { tenantId, phone } },
      create: { tenantId, phone, name: 'Test', source: 'WhatsApp' },
      update: { name: 'Test' }
    });
    console.log('upsert success:', contact.id);

    let conversation = await prisma.conversation.findFirst({
      where: {
        tenantId,
        contactId: contact.id,
        status: { not: 'resolved' }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          tenantId,
          contactId: contact.id,
          status: 'bot_active',
        }
      });
    }
    console.log('conversation success:', conversation.id);

    const savedMessage = await prisma.message.create({
      data: {
        tenantId,
        conversationId: conversation.id,
        contactId: contact.id,
        providerMessageId: messageId,
        direction: 'INBOUND',
        content: 'hello',
        senderType: 'contact',
        status: 'delivered', 
      }
    });
    console.log('message create success:', savedMessage.id);

  } catch(e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
