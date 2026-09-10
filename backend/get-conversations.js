const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const convs = await prisma.conversation.findMany({
    include: { contact: true }
  });
  console.log(JSON.stringify(convs.map(c => ({ id: c.id, contact: c.contact.name, phone: c.contact.phone, status: c.status })), null, 2));
}

main().finally(() => prisma.$disconnect());
