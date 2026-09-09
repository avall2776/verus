const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'tenant_123'; // O tenant atual que estávamos usando

  // Verifica se o tenant existe, se não, cria (improvável que não exista)
  let tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    // Para fins de dev, caso db tenha sido apagado
    // Precisaria de um Plano, mas a rigor esse tenant existe pois já funcionou
    console.log("Tenant não encontrado!");
    return;
  }

  const email = 'admin@verto.com';
  const password = 'admin'; // Senha simplificada
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    console.log(`Usuário ${email} atualizado com nova senha (admin).`);
  } else {
    await prisma.user.create({
      data: {
        name: 'Administrador',
        email,
        password: hashedPassword,
        role: 'ADMIN',
        tenantId
      }
    });
    console.log(`Usuário ${email} criado com senha (admin).`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
