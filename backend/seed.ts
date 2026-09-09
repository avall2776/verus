import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plan = await prisma.plan.create({
    data: {
      name: 'Pro',
      price: 199.90,
      hasCRM: true,
      hasWhatsApp: true,
      hasAIAgent: true,
    }
  });

  await prisma.tenant.create({
    data: {
      id: 'tenant_123',
      name: 'Empresa Teste',
      planId: plan.id,
      isActive: true,
    }
  });

  console.log('Seed executado com sucesso: tenant_123 criado!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
