const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  for (const tenant of tenants) {
    console.log(`Configurando horário comercial para Tenant ${tenant.id}`);
    
    // Segunda(1) a Sexta(5)
    for (let day = 1; day <= 5; day++) {
      await prisma.businessHours.upsert({
        where: {
          tenantId_departmentId_dayOfWeek: {
            tenantId: tenant.id,
            departmentId: '', // workaround para prisma optional field in unique? 
            dayOfWeek: day
          }
        },
        create: {
          tenantId: tenant.id,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '18:00',
          isActive: true
        },
        update: {}
      }).catch(async (e) => {
        // Se der erro por causa do departmentId optional
        const exists = await prisma.businessHours.findFirst({
          where: { tenantId: tenant.id, dayOfWeek: day }
        });
        if (!exists) {
          await prisma.businessHours.create({
            data: {
              tenantId: tenant.id,
              dayOfWeek: day,
              startTime: '08:00',
              endTime: '18:00',
              isActive: true
            }
          });
        }
      });
    }
  }
  console.log('Seed concluído!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
