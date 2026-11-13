const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteScript = `
    const axios = require('/root/verus/backend/node_modules/axios');

    async function test() {
      const targetInstanceName = 'versus_fc89e34b2b_babdc262eb';
      const apiKey = 'verto_token_babdc262eb';
      const numbers = ['555496124131', '555496144010', '555492124368'];

      for (const num of numbers) {
        console.log('\\n--- Testando ' + num + ' ---');
        try {
          const res = await axios.post('http://localhost:8080/chat/fetchProfile/' + targetInstanceName, {
            number: num
          }, {
            headers: { apikey: apiKey },
            timeout: 8000
          });
          console.log('fetchProfile:', res.data);
        } catch (e) {
          console.log('fetchProfile erro:', e.message, e.response?.data);
        }
      }
    }
    test().catch(console.error);
  `;

  conn.exec(`node -e "${remoteScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, (err, stream) => {
    let out = '';
    stream.on('close', () => {
      console.log(out);
      conn.end();
    }).on('data', d => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});

