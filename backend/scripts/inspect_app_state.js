const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const fs = require("fs");
const { execSync } = require("child_process");

try {
  const output = execSync("docker exec evolution-api cat /evolution/instances/versus_fc89e34b2b_babdc262eb/app-state-sync-version-regular_low.json").toString();
  console.log("Length:", output.length);
  const json = JSON.parse(output);
  console.log("Keys:", Object.keys(json));
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
