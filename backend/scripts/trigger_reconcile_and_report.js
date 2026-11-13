const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteScript = `
    const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
    const axios = require('/root/verus/backend/node_modules/axios');
    const prisma = new PrismaClient();

    async function run() {
      const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
      
      console.log('Chamando endpoint interno de sincronizacao e resolucao...');
      try {
        const syncRes = await axios.post('http://localhost:3001/api/whatsapp/sync-contacts', { tenantId });
        console.log('Resultado /sync-contacts:', syncRes.data);
      } catch (err) {
        console.log('Erro ao chamar /sync-contacts:', err.message);
      }

      // Consulta os contatos que foram resolvidos
      const resolved = await prisma.contact.findMany({
        where: {
          tenantId,
          whatsappLid: { not: null },
          NOT: { phone: { contains: 'lid' } }
        },
        select: { id: true, name: true, phone: true, whatsappLid: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 25
      });
      console.log('\\n=== TOP 25 CONTATOS RESOLVIDOS COM SUCESSO (TELEFONE REAL + LID ASSOCIADO) ===');
      console.log(JSON.stringify(resolved, null, 2));

      // Contatos que ainda permanecem com @lid
      const stillLid = await prisma.contact.findMany({
        where: {
          tenantId,
          phone: { contains: 'lid' }
        },
        select: { id: true, name: true, phone: true, whatsappLid: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 20
      });
      console.log('\\n=== CONTATOS QUE AINDA RESTAM COM @lid ===');
      console.log(JSON.stringify(stillLid, null, 2));

      await prisma.$disconnect();
    }
    run().catch(console.error);
  `;

  conn.exec(`node -e "${remoteScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('RELATORIO:\n' + out);
      conn.end();
    }).on('data', d => out += d).stderr.on('data', d => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
