const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const axios = require("/root/verus/backend/node_modules/axios");

async function run() {
  const instName = "versus_fc89e34b2b_babdc262eb";
  const evoRes = await axios.post("http://localhost:8080/chat/findContacts/" + instName, {}, {
    headers: { apikey: "verto123" }
  });
  const contacts = evoRes.data || [];
  const found = contacts.filter(c => 
    (c.name && c.name.toLowerCase().includes("malvestitti")) ||
    (c.pushName && c.pushName.toLowerCase().includes("malvestitti")) ||
    (c.name && c.name.toLowerCase().includes("antonio")) ||
    (c.pushName && c.pushName.toLowerCase().includes("antonio"))
  );
  console.log("Contatos com Antonio / Malvestitti na Evolution:", found);
}
run().catch(console.error);
'
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
