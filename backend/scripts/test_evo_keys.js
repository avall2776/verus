const { Client } = require('ssh2');

const scriptCode = `
const axios = require('/root/verus/backend/node_modules/axios');

async function run() {
  const evolutionUrl = 'http://localhost:8080';
  const instance = 'versus_fc89e34b2b_babdc262eb';
  
  console.log('--- Teste 1: com apikey verto_token_babdc262eb ---');
  try {
    const res = await axios.get(evolutionUrl + '/instance/connectionState/' + instance, {
      headers: { apikey: 'verto_token_babdc262eb' }
    });
    console.log('Sucesso Teste 1:', res.data);
  } catch (e) {
    console.log('Erro Teste 1:', e.message, e.response?.data);
  }

  console.log('\\n--- Teste 2: com apikey global verto123 ---');
  try {
    const res = await axios.get(evolutionUrl + '/instance/connectionState/' + instance, {
      headers: { apikey: 'verto123' }
    });
    console.log('Sucesso Teste 2:', res.data);
  } catch (e) {
    console.log('Erro Teste 2:', e.message, e.response?.data);
  }

  console.log('\\n--- Teste 3: com a outra instância versus_dfd8dbc7b0_e237492e8c ---');
  try {
    const res = await axios.get(evolutionUrl + '/instance/connectionState/versus_dfd8dbc7b0_e237492e8c', {
      headers: { apikey: 'verto123' }
    });
    console.log('Sucesso Teste 3 (verto123):', res.data);
  } catch (e) {
    console.log('Erro Teste 3:', e.message, e.response?.data);
  }

  try {
    const res = await axios.get(evolutionUrl + '/instance/connectionState/versus_dfd8dbc7b0_e237492e8c', {
      headers: { apikey: 'tok_versus_dfd8dbc7b0_e237492e8c' }
    });
    console.log('Sucesso Teste 3 (token do db):', res.data);
  } catch (e) {
    console.log('Erro Teste 3 token db:', e.message, e.response?.data);
  }
}

run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/test_evo_keys.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/test_evo_keys.js', (err, stream) => {
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

