const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const axios = require("/root/verus/backend/node_modules/axios");

async function run() {
  const instName = "versus_fc89e34b2b_babdc262eb";
  try {
    const res = await axios.post("http://localhost:8080/chat/findMessages/" + instName, {
      where: {
        key: {
          remoteJid: "215847943540795@lid"
        }
      }
    }, {
      headers: { apikey: "verto123" }
    });
    console.log("Mensagens de Antonio no Evolution:", res.data.length);
    if (res.data.length > 0) {
      console.log("Primeira msg:", JSON.stringify(res.data[0], null, 2));
      console.log("Ultima msg:", JSON.stringify(res.data[res.data.length - 1], null, 2));
    }
  } catch (e) {
    console.log("Erro:", e.response?.data || e.message);
  }
}
run();
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
