const { Client } = require('ssh2');

const scriptCode = `
const axios = require('/root/verus/backend/node_modules/axios');

async function run() {
  const serverUrl = 'http://localhost:8080';
  const instance = 'versus_fc89e34b2b_babdc262eb';
  const apiKey = 'verto_token_babdc262eb';

  console.log('--- 1. Buscando contatos na Evolution com 81363966 ---');
  try {
    const res = await axios.post(serverUrl + '/chat/findContacts/' + instance, {
      where: {
        OR: [
          { id: { contains: '81363966' } },
          { id: { contains: '8783325601805' } },
          { name: { contains: 'tiao' } },
          { name: { contains: 'tião' } }
        ]
      }
    }, { headers: { apikey: apiKey }, timeout: 10000 });
    console.log('Contatos Evolution:', res.data);
  } catch (e) {
    console.log('Erro findContacts:', e.message);
  }

  console.log('\\n--- 2. Buscando chat na Evolution ---');
  try {
    const res = await axios.post(serverUrl + '/chat/findChats/' + instance, {
      where: {
        OR: [
          { id: { contains: '81363966' } },
          { id: { contains: '8783325601805' } }
        ]
      }
    }, { headers: { apikey: apiKey }, timeout: 10000 });
    console.log('Chats Evolution:', res.data);
  } catch (e) {
    console.log('Erro findChats:', e.message);
  }

  console.log('\\n--- 3. Buscando mensagens na Evolution para 8783325601805@lid ou 556781363966 ou 5567981363966 ---');
  const targetJids = [
    '8783325601805@lid',
    '5567981363966@s.whatsapp.net',
    '556781363966@s.whatsapp.net'
  ];

  for (const jid of targetJids) {
    try {
      const res = await axios.post(serverUrl + '/chat/findMessages/' + instance, {
        where: {
          key: {
            remoteJid: jid
          }
        }
      }, { headers: { apikey: apiKey }, timeout: 10000 });
      console.log('Msgs para ' + jid + ':', Array.isArray(res.data) ? res.data.length : res.data);
      if (Array.isArray(res.data) && res.data.length > 0) {
        console.log('Ultima msg de ' + jid + ':', JSON.stringify(res.data[res.data.length - 1], null, 2));
      }
    } catch (e) {
      console.log('Erro findMessages para ' + jid + ':', e.message);
    }
  }
}

run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/fetch_evo_tiao.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/fetch_evo_tiao.js', (err, stream) => {
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

