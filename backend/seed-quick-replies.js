const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  for (const tenant of tenants) {
    console.log(`Configurando Quick Replies para Tenant ${tenant.id}`);
    
    const macros = [
      { shortcut: '/ola', content: 'Olá! Como posso ajudar você hoje?' },
      { shortcut: '/pix', content: 'Nossa chave PIX é: cnpj 00.000.000/0001-00' },
      { shortcut: '/catalogo', content: 'Você pode acessar nosso catálogo em: https://catalogo.com' },
      { shortcut: '/horario', content: 'Atendemos de segunda a sexta, das 08h às 18h.' }
    ];

    for (const macro of macros) {
      await prisma.quickReply.upsert({
        where: {
          tenantId_shortcut: {
            tenantId: tenant.id,
            shortcut: macro.shortcut
          }
        },
        create: {
          tenantId: tenant.id,
          shortcut: macro.shortcut,
          content: macro.content
        },
        update: {}
      });
    }
  }
  console.log('Seed de Quick Replies concluído!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
