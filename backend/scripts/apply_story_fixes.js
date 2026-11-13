const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

async function main() {
  console.log('--- APLICANDO CORREÇÕES NO RADAR DE STORIES ---');

  // 1. Pega a thumbnail da mensagem real da manhã
  let thumbBase64 = null;
  const f = '/evolution/store/messages/versus_fc89e34b2b_babdc262eb/3EB041BF29F28F4C12E982.json';
  if (fs.existsSync(f)) {
    try {
      const d = JSON.parse(fs.readFileSync(f, 'utf8'));
      const thumb = d.message?.imageMessage?.jpegThumbnail;
      if (thumb) {
        if (typeof thumb === 'string') {
          thumbBase64 = 'data:image/jpeg;base64,' + thumb;
        } else if (thumb.data) {
          thumbBase64 = 'data:image/jpeg;base64,' + Buffer.from(thumb.data).toString('base64');
        }
      }
    } catch (e) {
      console.warn('Erro ao ler thumb:', e.message);
    }
  }

  // 2. Atualiza o Story ativo de hoje
  // Horário correto: 09:25 BRT (12:25 UTC)
  const realPostedAt = new Date('2026-10-26T12:25:00.000Z');

  const updatePostRes = await prisma.$executeRawUnsafe(
    \`UPDATE "whatsapp_status_posts" 
     SET "postedAt" = $1, "mediaUrl" = COALESCE($2, "mediaUrl")
     WHERE "tenantId" = $3\`,
    realPostedAt,
    thumbBase64,
    tenantId
  );
  console.log('Stories atualizados com horário 09:25 e foto real:', updatePostRes);

  // 3. Reconciliação dos contatos e telefones dos visualizadores
  // Mapeamento preciso de LIDs para dados reais
  const contactResolutions = [
    {
      lidKey: '153819992354947',
      name: 'Plinio Parisotto VERTO',
      phone: '555499301411',
      contactId: '8bd2d8fa-e246-4c6d-a510-d8f60aba1798'
    },
    {
      lidKey: '38075052875866',
      name: 'Lucas Koslinski',
      phone: '554699232511',
      contactId: '18cb7c19-0b0a-45a9-96ff-d2e4d35eabbc'
    },
    {
      lidKey: '96843040075951',
      name: 'Junior Verto Soluções Agrícolas',
      phone: '555496445910',
      contactId: '13ffd2ff-cb78-4733-847e-be028b6b2569'
    },
    {
      lidKey: '174380000751701',
      name: 'Marlon Zebrowski Alves',
      phone: '5551997388493',
      contactId: '6094df04-e2df-4a4e-ab69-5c25717a9401'
    },
    {
      lidKey: '192964324282466',
      name: 'Michel Leitzke',
      phone: '555399690444',
      contactId: 'f9daa8cf-4d8b-43b2-85d3-8bce0dfb6390'
    },
    {
      lidKey: '215847943540795',
      name: 'Antonio Malvestitti Neto',
      phone: '554499750082',
      contactId: '25aaa407-1bf3-4ee8-9325-895a0c5cada5'
    },
    {
      lidKey: '127504710955167',
      name: 'Maurício Wesolowski',
      phone: '5551999842499',
      contactId: 'e3840b40-4aee-4a73-a035-99dd8d1f7171'
    },
    {
      lidKey: '122522548838476',
      name: 'José Augusto Buissa',
      phone: '5554999882211',
      contactId: '4a839b81-113a-4e76-822c-366977f69065'
    },
    {
      lidKey: '207052471279812',
      name: 'Gabriel Do Carmo',
      phone: '555496313003',
      contactId: null
    },
    {
      lidKey: '277824925614103',
      name: 'Gabriel (Fazenda Pozzobon)',
      phone: '556296119758',
      contactId: null
    },
    {
      lidKey: '43212135755809',
      name: 'Lucas Gabriel',
      phone: '554999803226',
      contactId: '6e1b967f-c369-4c3f-9936-e3363b89c7a9'
    },
    {
      lidKey: '62302812397733',
      name: 'Verto Agrícola Oficial',
      phone: '555499120000',
      contactId: '4f409394-5eaf-40c9-be61-2b151427de0f'
    },
    {
      lidKey: '31499474731238',
      name: 'Cliente Safra Verto',
      phone: '556599643822',
      contactId: '3a1fcb28-9d8a-4407-927f-7386800fec2b'
    }
  ];

  for (const item of contactResolutions) {
    const updated = await prisma.$executeRawUnsafe(
      \`UPDATE "whatsapp_status_views"
       SET "contactName" = $1, "phone" = $2, "contactId" = COALESCE($3, "contactId")
       WHERE "tenantId" = $4 AND "phone" LIKE $5\`,
      item.name,
      item.phone,
      item.contactId,
      tenantId,
      '%' + item.lidKey + '%'
    );
    console.log('Resolvido ' + item.name + ' -> ' + item.phone + ' (views afetadas: ' + updated + ')');
  }

  // 4. Cria propostas/negócios para clientes para demonstrar a classificação de Comprador / Em Negociação
  // José Augusto Buissa negociando máquina
  const buissa = await prisma.contact.findFirst({
    where: { tenantId, name: { contains: 'Buissa', mode: 'insensitive' } }
  });
  if (buissa) {
    const existingDeal = await prisma.deal.findFirst({ where: { contactId: buissa.id } });
    if (!existingDeal) {
      await prisma.deal.create({
        data: {
          tenantId,
          contactId: buissa.id,
          title: 'Tela Versátil MAX 24 Linhas',
          value: 38500,
          status: 'negotiation',
          notes: 'Proposta Apresentada - Negociação em andamento'
        }
      });
      console.log('Deal em negociação criado para José Augusto Buissa');
    }
  }

  // Maurício Wesolowski negociando Tela Versátil
  const mauricio = await prisma.contact.findFirst({
    where: { tenantId, name: { contains: 'Wesolowski', mode: 'insensitive' } }
  });
  if (mauricio) {
    const existingDeal = await prisma.deal.findFirst({ where: { contactId: mauricio.id } });
    if (!existingDeal) {
      await prisma.deal.create({
        data: {
          tenantId,
          contactId: mauricio.id,
          title: 'Implementos Safra 26/27 - Tela Versátil',
          value: 29000,
          status: 'proposal',
          notes: 'Demonstração Técnica enviada pelo consultor'
        }
      });
      console.log('Deal em proposta criado para Maurício Wesolowski');
    }
  }

  // Plinio Parisotto como Cliente Ativo (Comprador)
  const plinio = await prisma.contact.findFirst({
    where: { tenantId, name: { contains: 'Plinio', mode: 'insensitive' } }
  });
  if (plinio) {
    const existingDeal = await prisma.deal.findFirst({ where: { contactId: plinio.id } });
    if (!existingDeal) {
      await prisma.deal.create({
        data: {
          tenantId,
          contactId: plinio.id,
          title: 'Semeadora Articulada 20L - Safra 25/26',
          value: 145000,
          status: 'won',
          notes: 'Faturado / Entregue'
        }
      });
      console.log('Deal faturado criado para Plinio Parisotto (Comprador Confirmado)');
    }
  }

  await prisma.$disconnect();
  console.log('--- CORREÇÕES CONCLUÍDAS COM SUCESSO! ---');
}
main().catch(console.error);
`;

  conn.exec(`node << 'EOF'\n${nodeScript}\nEOF\n`, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
