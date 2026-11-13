const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.department.updateMany({
    where: { name: 'Comercial Geral' },
    data: { name: 'Comercial' }
  });
  console.log('Departments updated:', result);
}
main().catch(console.error).finally(() => prisma.$disconnect());
