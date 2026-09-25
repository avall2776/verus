const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const axios = require("/root/verus/backend/node_modules/axios");

async function main() {
  const instName = "versus_c38f8968ee_1bceb585fb";
  // 1. Busca chats da Evolution
  const chatsRes = await axios.post("http://localhost:8080/chat/findChats/" + instName, {}, {
    headers: { apikey: "verto123" }
  }).catch(e => ({ data: e.response ? e.response.data : e.message }));

  if (Array.isArray(chatsRes.data)) {
    console.log("Total de chats no Evolution:", chatsRes.data.length);
    // Filtrar chats que contenham lid ou amor ou william ou 9181 ou 9982
    const relevant = chatsRes.data.filter(c => 
      (c.id && (c.id.includes("89026300264466") || c.id.includes("260030221811836") || c.id.includes("91813232") || c.id.includes("99822129") || c.id.includes("97036229"))) ||
      (c.name && (c.name.toLowerCase().includes("amor") || c.name.toLowerCase().includes("william")))
    );
    console.log("Chats relevantes encontrados:", JSON.stringify(relevant, null, 2));
  } else {
    console.log("Resposta findChats:", chatsRes.data);
  }

  // 2. Busca contato 89026300264466 e 260030221811836 na lista de contatos do Evolution
  const fc = await axios.post("http://localhost:8080/chat/findContacts/" + instName, {}, {
    headers: { apikey: "verto123" }
  });
  if (Array.isArray(fc.data)) {
    const lids = fc.data.filter(c => 
      c.id && (c.id.includes("89026300264466") || c.id.includes("260030221811836") || c.id.includes("91813232") || c.id.includes("99822129"))
    );
    console.log("Contatos com esses IDs na Evolution:", JSON.stringify(lids, null, 2));
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
