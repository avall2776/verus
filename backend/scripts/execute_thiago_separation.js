const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== SEPARANDO THIAGO CASTILHO DO THIAGO ANTIGO ===');

  const castilhoId = 'fe63529b-e4a6-4aec-a92b-c6f2a75edfb1';
  const castilhoConvId = '292a63c0-bf77-4910-b104-25db7d2ad213';
  const thiagoAntigoId = '52ef853f-f065-4303-b084-2ef49437f518';
  const thiagoAntigoConvId = '0e32a6b4-51cb-42d6-aa1d-ba3a85b9de4c';
  const semeadoraMsgId = '0f27920e-8241-4029-a737-50ef915a2057';

  // 1. Move a mensagem da Semeadora para Thiago Castilho
  const movedMsg = await prisma.message.update({
    where: { id: semeadoraMsgId },
    data: {
      contactId: castilhoId,
      conversationId: castilhoConvId,
    }
  });
  console.log('Mensagem movida com sucesso:', movedMsg.id, '-> nova conversa:', movedMsg.conversationId);

  // 2. Atualiza Thiago Castilho com telefone normalizado, whatsappLid e avatar real
  const castilhoAvatar = 'https://pps.whatsapp.net/v/t61.24694-24/646165866_924580307319280_8893710358596996013_n.jpg?ccb=11-4&oh=01_Q5Aa6AFbTVm0zdDIDcT8U8AkwtHrgTHmx9EKJ32ZTZvQjp0BMA&oe=6AFC4623&_nc_sid=5e03e0&_nc_cat=102';
  const updatedCastilho = await prisma.contact.update({
    where: { id: castilhoId },
    data: {
      phone: '5518997777766',
      whatsappLid: '232959059693735@lid',
      avatarUrl: castilhoAvatar
    }
  });
  console.log('Thiago Castilho atualizado:', {
    id: updatedCastilho.id,
    name: updatedCastilho.name,
    phone: updatedCastilho.phone,
    lid: updatedCastilho.whatsappLid,
    hasAvatar: !!updatedCastilho.avatarUrl
  });

  // 3. Atualiza a conversa do Thiago Castilho como NOVO CONTATO AGUARDANDO ATENDIMENTO
  const updatedCastilhoConv = await prisma.conversation.update({
    where: { id: castilhoConvId },
    data: {
      status: 'waiting',
      updatedAt: new Date('2026-11-07T11:28:29.058Z')
    }
  });
  console.log('Conversa Thiago Castilho atualizada:', {
    id: updatedCastilhoConv.id,
    status: updatedCastilhoConv.status,
    updatedAt: updatedCastilhoConv.updatedAt
  });

  // 4. Restaura a conversa do Thiago Antigo para o horário da sua última mensagem real (03/11/2026 23:01:20)
  const lastRealMsgThiago = await prisma.message.findFirst({
    where: { conversationId: thiagoAntigoConvId },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Última mensagem real do Thiago Antigo:', {
    id: lastRealMsgThiago?.id,
    createdAt: lastRealMsgThiago?.createdAt,
    content: lastRealMsgThiago?.content?.substring(0, 40)
  });

  if (lastRealMsgThiago) {
    await prisma.conversation.update({
      where: { id: thiagoAntigoConvId },
      data: {
        updatedAt: lastRealMsgThiago.createdAt
      }
    });
  }

  // Desvincula o LID 232959059693735 do Thiago antigo se estiver nele
  const thiagoAntigo = await prisma.contact.findUnique({ where: { id: thiagoAntigoId } });
  if (thiagoAntigo?.whatsappLid === '232959059693735@lid') {
    await prisma.contact.update({
      where: { id: thiagoAntigoId },
      data: { whatsappLid: null }
    });
    console.log('LID do Thiago Castilho removido do Thiago antigo.');
  }

  console.log('\n=== SEPARAÇÃO CONCLUÍDA COM SUCESSO ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());

