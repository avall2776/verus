const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@versus.com' },
    update: {
      password: hashedPassword
    },
    create: {
      name: 'Admin VERSUS',
      email: 'admin@versus.com',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: 'tenant_123'
    }
  });

  console.log('Usuário Admin criado com sucesso!');
  console.log('Login: admin@versus.com');
  console.log('Senha: admin123');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
