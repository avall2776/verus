const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const axios = require("/root/verus/backend/node_modules/axios");

async function run() {
  const instName = "versus_fc89e34b2b_babdc262eb";
  const lid = "215847943540795@lid";
  const headers = { apikey: "verto123" };

  // 1. Testar whatsappNumber / checkIsWhatsapp
  try {
    const res = await axios.post("http://localhost:8080/chat/whatsappNumbers/" + instName, {
      numbers: [lid]
    }, { headers });
    console.log("whatsappNumbers:", res.data);
  } catch (e) {
    console.log("whatsappNumbers erro:", e.response?.data || e.message);
  }

  // 2. Testar findContacts com where id = lid
  try {
    const res = await axios.post("http://localhost:8080/chat/findContacts/" + instName, {
      where: { id: lid }
    }, { headers });
    console.log("findContacts where id:", res.data);
  } catch (e) {
    console.log("findContacts erro:", e.response?.data || e.message);
  }

  // 3. Testar fetchProfile
  try {
    const res = await axios.post("http://localhost:8080/chat/fetchProfile/" + instName, {
      number: lid
    }, { headers });
    console.log("fetchProfile:", res.data);
  } catch (e) {
    console.log("fetchProfile erro:", e.response?.data || e.message);
  }

  // 4. Testar fetchProfilePictureUrl
  try {
    const res = await axios.post("http://localhost:8080/chat/fetchProfilePictureUrl/" + instName, {
      number: lid
    }, { headers });
    console.log("fetchProfilePictureUrl:", res.data);
  } catch (e) {
    console.log("fetchProfilePictureUrl erro:", e.response?.data || e.message);
  }
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
