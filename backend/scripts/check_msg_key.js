const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const fs = require('fs');

const f = '/evolution/store/messages/versus_fc89e34b2b_babdc262eb/3EB0F8FCDFAD11799F26A6.json';
if (fs.existsSync(f)) {
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  console.log('3EB0F8FCDFAD11799F26A6:', JSON.stringify(data.key, null, 2));
} else {
  console.log('File not found');
}
`;

  const remoteCmd = `docker exec -i evolution-api node << 'EOF'
${nodeScript}
EOF
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
