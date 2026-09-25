const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const axios = require("/root/verus/backend/node_modules/axios");

async function main() {
  const instName = "versus_c38f8968ee_1bceb585fb";
  console.log("Chamando findContacts na instancia:", instName);
  const fc = await axios.post("http://localhost:8080/chat/findContacts/" + instName, {}, {
    headers: { apikey: "verto123" }
  }).catch(e => ({ data: e.response ? e.response.data : e.message }));

  if (Array.isArray(fc.data)) {
    console.log("Total contatos retornados:", fc.data.length);
    // Mostrar 3 contatos de exemplo
    console.log("Exemplo de contato 1:", JSON.stringify(fc.data[0], null, 2));
    if (fc.data.length > 1) {
      console.log("Exemplo de contato 2:", JSON.stringify(fc.data[1], null, 2));
    }
    // Procurar Ernesto ou Santos ou 1736800
    const ernesto = fc.data.filter(c => 
      (c.name && c.name.toLowerCase().includes("ernesto")) || 
      (c.pushName && c.pushName.toLowerCase().includes("ernesto")) ||
      (c.id && c.id.includes("1736800")) ||
      (c.id && c.id.includes("ernesto"))
    );
    console.log("Busca Ernesto:", JSON.stringify(ernesto, null, 2));
  } else {
    console.log("Resultado não é array:", JSON.stringify(fc.data, null, 2));
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
