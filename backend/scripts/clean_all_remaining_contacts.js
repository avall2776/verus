const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== REALIZANDO SANEAMENTO E SEPARAÇÃO DE TODOS OS CONTATOS RESTANTES ===\n');

  // 1. Samuel Prado & Samuel Magno
  console.log('1. Saneando Samuel Prado...');
  await prisma.message.updateMany({
    where: { conversationId: '143b1a46-6c0e-4164-92d7-32c3cfdc8651' },
    data: { contactId: 'aa630430-e411-46c5-887d-45f516ecb457' }
  });
  await prisma.contact.update({
    where: { id: 'aa630430-e411-46c5-887d-45f516ecb457' },
    data: { whatsappLid: '143164262334589@lid' }
  });
  await prisma.contact.delete({ where: { id: 'd598b0aa-0603-44ad-bbbe-a0a4c6b97c3c' } }).catch(() => {});
  console.log('  -> Samuel Prado consolidado com sucesso!');

  // 2. Thiago Santos & Thiagosanto
  console.log('2. Saneando Thiago Santos...');
  await prisma.message.updateMany({
    where: { conversationId: 'e81b0bc8-2792-4638-9504-caf7c5f5658f' },
    data: { contactId: '87df09a5-c18b-425e-bbe4-b8ddef861e77' }
  });
  await prisma.contact.update({
    where: { id: '87df09a5-c18b-425e-bbe4-b8ddef861e77' },
    data: { whatsappLid: '108272552046652@lid' }
  });
  await prisma.contact.delete({ where: { id: '0af4c6aa-99be-443d-b2cb-55f33abe0484' } }).catch(() => {});
  console.log('  -> Thiago Santos consolidado com sucesso!');

  // 3. Antônio Ferreira Saraíva (separado do Antônio 🇧🇷 do MT)
  console.log('3. Separando Antônio Ferreira Saraíva de Antônio 🇧🇷...');
  // Atualiza as 4 mensagens da conversa temporária c8405972 para o contato do LID
  await prisma.message.updateMany({
    where: { conversationId: 'c8405972-3eb8-4d79-af7f-4de101dd7aa4' },
    data: { contactId: '491888ff-5cab-44b6-bf78-bebe32c81370' }
  });
  // Nomeia o contato como Antônio Ferreira Saraíva
  await prisma.contact.update({
    where: { id: '491888ff-5cab-44b6-bf78-bebe32c81370' },
    data: {
      name: 'Antônio Ferreira Saraíva',
      whatsappLid: '72426654277676@lid'
    }
  });
  console.log('  -> Antônio Ferreira Saraíva isolado em sua própria conversa!');

  // 4. Gerson (mensagens temporárias unificadas na conversa real do Gerson)
  console.log('4. Consolidando Gerson...');
  await prisma.message.updateMany({
    where: { conversationId: 'c1b01da1-f28b-4ce9-be8d-6d606a3c5dbe' },
    data: {
      conversationId: '86dacb22-fba7-426a-83b8-c9eb5f77ea12',
      contactId: 'bcb21cd8-f7d7-4486-a2a1-a2ad5dc6c34d'
    }
  });
  await prisma.conversation.delete({ where: { id: 'c1b01da1-f28b-4ce9-be8d-6d606a3c5dbe' } }).catch(() => {});
  await prisma.contact.delete({ where: { id: '72aaf542-ca34-4bf3-92cd-3e0e15833b71' } }).catch(() => {});
  console.log('  -> Gerson consolidado na conversa real!');

  // 5. Verifica se ainda restou alguma mensagem com contactId != conv_contact
  const remaining = await prisma.$queryRaw`
    SELECT count(*)::int as total
    FROM "Message" m
    JOIN "Conversation" c ON m."conversationId" = c.id
    WHERE m."contactId" != c."contactId";
  `;

  console.log('\n=== RESULTADO FINAL: MENSAGENS COM INCONSISTÊNCIA ===', remaining);
}

main().catch(console.error).finally(() => prisma.$disconnect());

