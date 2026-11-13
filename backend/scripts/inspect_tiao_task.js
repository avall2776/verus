const { Client } = require('ssh2');

const scriptCode = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const axios = require('/root/verus/backend/node_modules/axios');
const prisma = new PrismaClient();

async function run() {
  console.log('=== 1. BUSCANDO ATENDENTE JANAINA NO DB ===');
  const janainas = await prisma.user.findMany({
    where: { name: { contains: 'janaina', mode: 'insensitive' } },
    select: { id: true, name: true, email: true, tenantId: true, role: true }
  });
  console.log('Janainas:', JSON.stringify(janainas, null, 2));

  console.log('\\n=== 2. BUSCANDO CONTATO NO DB ===');
  const phones = ['556781363966', '5567981363966', '6781363966', '67981363966'];
  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { phone: { in: phones } },
        { phone: { contains: '81363966' } },
        { whatsappLid: { contains: '81363966' } },
        { name: { contains: 'tiao', mode: 'insensitive' } },
        { name: { contains: 'tião', mode: 'insensitive' } }
      ]
    },
    include: {
      conversations: {
        include: {
          messages: { take: 3, orderBy: { createdAt: 'desc' } }
        }
      }
    }
  });
  console.log('Contatos DB:', JSON.stringify(contacts.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    whatsappLid: c.whatsappLid,
    tenantId: c.tenantId,
    assignedTo: c.assignedTo,
    convs: c.conversations.map(cv => ({
      id: cv.id,
      assignedTo: cv.assignedTo,
      status: cv.status,
      msgCount: cv.messages.length,
      lastMsg: cv.messages[0]?.content
    }))
  })), null, 2));

  console.log('\\n=== 3. BUSCANDO NA EVOLUTION API ===');
  const evoUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  const evoToken = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

  try {
    const instRes = await axios.get(evoUrl + '/instance/fetchInstances', {
      headers: { apikey: evoToken }
    });
    console.log('Instâncias Evolution:', instRes.data.map(i => ({ name: i.name, connectionStatus: i.connectionStatus })));

    for (const inst of instRes.data) {
      if (inst.connectionStatus !== 'open') continue;
      const instName = inst.name;
      console.log('\\n--- Contatos na instância ' + instName + ' ---');
      try {
        const cRes = await axios.post(evoUrl + '/chat/findContacts/' + instName, {}, {
          headers: { apikey: evoToken }, timeout: 10000
        });
        const matchContacts = (cRes.data || []).filter(c => {
          const id = c.id || '';
          const name = ((c.name || '') + ' ' + (c.pushName || '')).toLowerCase();
          return id.includes('81363966') || name.includes('tiao') || name.includes('tião');
        });
        console.log('Matches em ' + instName + ':', matchContacts);
      } catch (e) {
        console.log('Erro findContacts ' + instName + ':', e.message);
      }

      console.log('--- Chats na instância ' + instName + ' ---');
      try {
        const chatsRes = await axios.post(evoUrl + '/chat/findChats/' + instName, {}, {
          headers: { apikey: evoToken }, timeout: 10000
        });
        const matchChats = (chatsRes.data || []).filter(ch => {
          const id = ch.id || '';
          const name = ((ch.name || '') + ' ' + (ch.pushName || '')).toLowerCase();
          return id.includes('81363966') || name.includes('tiao') || name.includes('tião');
        });
        console.log('Matches chats em ' + instName + ':', matchChats);
      } catch (e) {
        console.log('Erro findChats ' + instName + ':', e.message);
      }
    }
  } catch (e) {
    console.log('Erro Evolution:', e.message);
  }

  await prisma.$disconnect();
}

run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/inspect_tiao.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/inspect_tiao.js', (err, stream) => {
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
