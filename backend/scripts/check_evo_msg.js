const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const axios = require("/root/verus/backend/node_modules/axios");
const prisma = new PrismaClient();

async function main() {
  const msg = await prisma.message.findFirst({
    where: {
      conversation: { contactId: "dc3d5734-df29-418a-ac83-7175055742a3" }
    }
  });
  console.log("MSG DC3D:", JSON.stringify(msg, null, 2));

  // Tenta buscar essa mensagem na Evolution API
  const instName = "versus_c38f8968ee_1bceb585fb";
  const evoMsg = await axios.post("http://localhost:8080/chat/findMessages/" + instName, {
    where: { key: { id: msg.providerMessageId } }
  }, {
    headers: { apikey: "verto123" }
  }).catch(e => ({ data: e.message }));
  console.log("EVOLUTION MSG:", JSON.stringify(evoMsg.data, null, 2));

  await prisma.$disconnect();
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
