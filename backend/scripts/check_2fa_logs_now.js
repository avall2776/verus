const { Client } = require('ssh2');

const scriptCode = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const axios = require('/root/verus/backend/node_modules/axios');
const { execSync } = require('child_process');
const prisma = new PrismaClient();

async function run() {
  console.log('=== 1. ÚLTIMOS LOGS DE 2FA NO PM2 ===');
  try {
    const logs = execSync('grep -a -i "2fa" /root/.pm2/logs/*.log | tail -n 25', { encoding: 'utf8' });
    console.log(logs);
  } catch (e) {
    console.log('Erro ao ler logs:', e.message);
  }

  console.log('=== 2. ÚLTIMOS REGISTROS NA TABELA TwoFactorVerification ===');
  const verifs = await prisma.twoFactorVerification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(verifs, null, 2));

  console.log('=== 3. INSTÂNCIAS DE WHATSAPP NO DB ===');
  const instances = await prisma.whatsAppInstance.findMany({
    select: {
      id: true,
      tenantId: true,
      name: true,
      phoneNumber: true,
      status: true,
      token: true,
      settings: true,
      updatedAt: true
    }
  });
  console.log(JSON.stringify(instances, null, 2));

  console.log('=== 4. TESTE DE CONEXÃO COM A INSTÂNCIA USADA NO DISPATCH ===');
  // Procura instância conectada externa (evitando disparar do mesmo número de destino 91109159)
  let instance = await prisma.whatsAppInstance.findFirst({
    where: {
      status: 'connected',
      phoneNumber: { not: { contains: '91109159' } },
    },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  });

  if (!instance) {
    instance = await prisma.whatsAppInstance.findFirst({
      where: { status: 'connected' },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  console.log('Instância selecionada para envio de 2FA:', instance);

  if (instance) {
    let evoInstanceName = instance?.settings?.instanceName;
    if (!evoInstanceName || !evoInstanceName.startsWith('versus_')) {
      if (instance?.name && instance.name.startsWith('versus_')) {
        evoInstanceName = instance.name.trim();
      } else {
        const shortTenant = instance.tenantId ? instance.tenantId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) : 'ten';
        const shortInst = instance.id ? instance.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) : 'inst';
        evoInstanceName = 'versus_' + shortTenant + '_' + shortInst;
      }
    }
    const apiKey = instance.token || process.env.EVOLUTION_API_KEY || 'verto123';
    console.log('Nome técnico resolvido:', evoInstanceName, 'apiKey:', apiKey);

    // Checar na Evolution API se essa instância está realmente conectada
    try {
      const stateRes = await axios.get('http://localhost:8080/instance/connectionState/' + evoInstanceName, {
        headers: { apikey: apiKey },
        timeout: 5000
      });
      console.log('Status real na Evolution API connectionState:', stateRes.data);
    } catch (e) {
      console.log('Erro ao checar connectionState na Evolution API:', e.message);
      if (e.response) console.log('Response data:', e.response.data);
    }
  }

  await prisma.$disconnect();
}

run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/check_2fa_now.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/check_2fa_now.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => {
          console.log(out);
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});

