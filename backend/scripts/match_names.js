const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const vertoId = "fc89e34b-2bc5-462d-9bfd-45b06e1d0126";

  const lids = [
    { name: "Malvestitti", lid: "215847943540795@lid" },
    { name: "Beto", lid: "272000379523191@lid" },
    { name: "Cleiton", lid: "196761159254044@lid" },
    { name: "Felipe", lid: "209706207412358@lid" },
    { name: "Sandro", lid: "51346669568105@lid" },
    { name: "Silvio", lid: "120701616926895@lid" },
    { name: "Paulo", lid: "270570172227757@lid" },
    { name: "André", lid: "190151171014750@lid" },
    { name: "Marcelo", lid: "30966814928900@lid" },
    { name: "Luis", lid: "140651622572141@lid" },
    { name: "Bruno", lid: "243851147145394@lid" }
  ];

  for (const item of lids) {
    const found = await prisma.contact.findMany({
      where: {
        tenantId: vertoId,
        name: { contains: item.name, mode: "insensitive" },
        NOT: { phone: { contains: "lid" } }
      },
      select: { id: true, name: true, phone: true }
    });
    console.log("Busca [" + item.name + "] (LID: " + item.lid + "): encontradas " + found.length + " opções:", found.slice(0, 3));
  }

  await prisma.$disconnect();
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
