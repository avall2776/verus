const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const axios = require('/root/verus/backend/node_modules/axios');

async function test() {
  const evoUrl = 'http://localhost:8080';
  const apiKey = 'verto123';
  const instance = 'versus_fc89e34b2b_babdc262eb';

  try {
    const res = await axios.post(
      evoUrl + '/chat/findMessages/' + instance,
      {
        where: {
          key: {
            remoteJid: 'status@broadcast'
          }
        }
      },
      { headers: { apikey: apiKey, 'Content-Type': 'application/json' } }
    );
    console.log('findMessages total:', Array.isArray(res.data) ? res.data.length : res.data);
    if (Array.isArray(res.data) && res.data.length > 0) {
      console.log('Sample message:', JSON.stringify(res.data[0], null, 2));
    }
  } catch (e) {
    console.error('ERROR:', e.response ? JSON.stringify(e.response.data) : e.message);
  }
}
test();
`;

  conn.exec(`cat << 'EOF' > /tmp/test_find_status.js\n${nodeScript}\nEOF\nnode /tmp/test_find_status.js`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
