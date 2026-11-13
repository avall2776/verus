const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const axios = require('/root/verus/backend/node_modules/axios');

async function main() {
  const instName = 'versus_fc89e34b2b_babdc262eb';
  const apiKey = 'verto123';
  const headers = { apikey: apiKey };

  // Consulta contato por LID no Baileys da Evolution API
  const res = await axios.post('http://localhost:8080/chat/findContacts/' + instName, {
    where: {
      id: '127504710955167@lid'
    }
  }, { headers });
  console.log('Find contact result:', res.data);

  // Consulta todos os contatos no store da Evolution API que contém Wesolowski ou Maurício
  const resAll = await axios.post('http://localhost:8080/chat/findContacts/' + instName, {}, { headers });
  const all = Array.isArray(resAll.data) ? resAll.data : [];
  console.log('Total contatos Evolution API:', all.length);

  const found = all.filter(c => 
    (c.name && c.name.toLowerCase().includes('wesolowski')) ||
    (c.pushName && c.pushName.toLowerCase().includes('wesolowski')) ||
    (c.id && c.id.includes('127504710955167'))
  );
  console.log('Matched in Evolution API:', found);
}
main().catch(console.error);
`;

  const remoteCmd = `node << 'EOF'
${nodeScript}
EOF
`;

  conn.exec(remoteCmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
