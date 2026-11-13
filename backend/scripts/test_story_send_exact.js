const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const axios = require('/root/verus/backend/node_modules/axios');

async function test() {
  const evoUrl = 'http://localhost:8080';
  const apiKey = 'verto123';
  const instance = 'versus_fc89e34b2b_babdc262eb';

  // Pequeno base64 de imagem JPEG 1x1
  const base64Sample = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  try {
    console.log('Sending base64 status...');
    const res = await axios.post(
      evoUrl + '/message/sendStatus/' + instance,
      {
        statusMessage: {
          type: 'image',
          content: base64Sample,
          caption: 'Teste Base64',
          statusJidList: ['555499112550@s.whatsapp.net', '555496283090@s.whatsapp.net']
        }
      },
      { headers: { apikey: apiKey, 'Content-Type': 'application/json' } }
    );
    console.log('SUCCESS base64 status:', JSON.stringify(res.data));
  } catch (e) {
    console.error('ERROR base64 status:', e.response ? JSON.stringify(e.response.data) : e.message);
  }
}
test();
`;

  conn.exec(`cat << 'EOF' > /tmp/test_story.js\n${nodeScript}\nEOF\nnode /tmp/test_story.js`, (err, stream) => {
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
