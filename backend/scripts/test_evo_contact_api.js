const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    const axios = require('axios');
    async function test() {
      try {
        const r1 = await axios.post('http://localhost:8080/chat/findContacts/versus_fc89e34b2b_babdc262eb', {
          where: { id: '207262371041280@lid' }
        }, { headers: { apikey: 'verto123' } });
        console.log('findContacts by lid:', r1.data);
      } catch(e) {
        console.log('r1 err:', e.response?.data || e.message);
      }

      try {
        const r2 = await axios.post('http://localhost:8080/contact/findContact/versus_fc89e34b2b_babdc262eb', {
          id: '207262371041280@lid'
        }, { headers: { apikey: 'verto123' } });
        console.log('findContact by lid:', r2.data);
      } catch(e) {
        console.log('r2 err:', e.response?.data || e.message);
      }
    }
    test();
  `;
  const stream = conn.exec('docker exec -i evolution-api node', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('Result:\n' + out);
      conn.end();
    }).on('data', (d) => out += d);
    stream.write(script);
    stream.end();
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
