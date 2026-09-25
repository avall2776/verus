const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const axios = require("/root/verus/backend/node_modules/axios");

async function main() {
  const instName = "versus_c38f8968ee_1bceb585fb";
  const fc = await axios.post("http://localhost:8080/chat/findContacts/" + instName, {}, {
    headers: { apikey: "verto123" }
  });
  if (Array.isArray(fc.data)) {
    // 1. Procura por 1271595553012
    const byLid = fc.data.filter(c => c.id && c.id.includes("1271595553012"));
    console.log("Por LID 1271595553012:", JSON.stringify(byLid, null, 2));

    // 2. Procura pela foto 317667080
    const byPhoto = fc.data.filter(c => c.profilePictureUrl && c.profilePictureUrl.includes("317667080"));
    console.log("Por Foto 317667080:", JSON.stringify(byPhoto, null, 2));

    // 3. Procura por todos que tenham Sophia ou Sofia
    const bySophia = fc.data.filter(c => 
      (c.pushName && (c.pushName.toLowerCase().includes("sophia") || c.pushName.toLowerCase().includes("sofia"))) ||
      (c.name && (c.name.toLowerCase().includes("sophia") || c.name.toLowerCase().includes("sofia")))
    );
    console.log("Todos Sophia na Evolution:", JSON.stringify(bySophia, null, 2));
  }
}
main().catch(console.error);
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
