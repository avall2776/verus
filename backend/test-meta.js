const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { id: 'tenant_123' },
    select: { metaToken: true, metaPhoneNumberId: true }
  });

  const lastContact = await prisma.contact.findFirst({
    orderBy: { updatedAt: 'desc' }
  });

  if (!lastContact || !lastContact.phone) {
    console.log('Nenhum contato encontrado no DB.');
    return;
  }

  console.log(`Tentando enviar mensagem para: ${lastContact.phone} usando Phone ID: ${tenant.metaPhoneNumberId}`);

  try {
    const url = `https://graph.facebook.com/v19.0/${tenant.metaPhoneNumberId}/messages`;
    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: lastContact.phone,
        type: "text",
        text: { body: "Olá do teste direto de API!" }
      },
      {
        headers: {
          'Authorization': `Bearer ${tenant.metaToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('SUCESSO! Resposta da Meta:', response.data);
  } catch (error) {
    console.error('ERRO DA META:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
