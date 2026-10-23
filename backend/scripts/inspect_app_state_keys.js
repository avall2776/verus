const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { execSync } = require("child_process");

try {
  const output = execSync("docker exec evolution-api cat /evolution/instances/versus_fc89e34b2b_babdc262eb/app-state-sync-version-regular_low.json").toString();
  const json = JSON.parse(output);
  const keys = Object.keys(json.indexValueMap || {});
  console.log("Total indexValueMap keys:", keys.length);
  console.log("Sample 10 keys:", keys.slice(0, 10));
  // Decodificar base64 ou ver o que são
  for (const k of keys.slice(0, 5)) {
    const buf = Buffer.from(k, "base64");
    console.log("Key base64:", k, "-> utf8:", buf.toString("utf8"));
  }
} catch (e) {
  console.log("Erro:", e.message);
}
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
