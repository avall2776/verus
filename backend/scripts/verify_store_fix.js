const { Client } = require('ssh2');

const remoteScript = `
const axios = require('/root/verus/backend/node_modules/axios');
const { execSync } = require('child_process');

async function run() {
  const evolutionUrl = 'http://localhost:8080';
  const evolutionGlobalKey = 'verto123';
  const instance = 'versus_fc89e34b2b_babdc262eb';

  console.log('1. Verificando estado da conexão...');
  const state = await axios.get(evolutionUrl + '/instance/connectionState/' + instance, {
    headers: { apikey: evolutionGlobalKey }
  });
  console.log('Estado:', JSON.stringify(state.data));

  console.log('\\n2. Enviando mensagem de teste 1...');
  const res1 = await axios.post(evolutionUrl + '/message/sendText/' + instance, {
    number: '555491109159',
    options: { delay: 500, presence: 'composing', linkPreview: false },
    textMessage: { text: 'Teste Definitivo 1 (STORE_MESSAGES=true): Sem bolha em branco e sincronizado no WhatsApp Web!' }
  }, {
    headers: { apikey: evolutionGlobalKey }
  });
  const msgId = res1.data?.key?.id;
  console.log('Mensagem enviada ID:', msgId);

  await new Promise(r => setTimeout(r, 2000));

  console.log('\\n3. Verificando se o arquivo JSON foi salvo no /evolution/store/messages/...');
  const storeFiles = execSync('docker exec evolution-api ls -la /evolution/store/messages/' + instance).toString();
  console.log(storeFiles);

  console.log('\\n4. Verificando logs do Evolution API (buscando ENOENT)...');
  const logs = execSync('docker logs evolution-api --tail 40 2>&1').toString();
  console.log(logs);
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/verify_store_fix.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/verify_store_fix.js', (err, stream) => {
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

