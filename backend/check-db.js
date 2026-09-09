const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const contact = await prisma.contact.findFirst({
    where: { phone: '555491109159' }, // The user's phone from screenshots
    include: {
      deals: true,
      conversations: {
        include: { messages: true }
      }
    }
  });

  console.log("Contact Name:", contact.name);
  console.log("Deals:", contact.deals);
}

main().catch(console.error).finally(() => prisma.$disconnect());
