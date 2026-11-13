const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const fs = require('fs');
const path = require('path');

const dirs = [
  '/evolution/store/chats/versus_fc89e34b2b_babdc262eb',
  '/evolution/store/contacts/versus_fc89e34b2b_babdc262eb'
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      if (content.toLowerCase().includes('wesolowski') || content.toLowerCase().includes('buissa') || content.toLowerCase().includes('malvestitti')) {
        console.log('Found in', f, ':', content);
      }
    } catch (e) {}
  }
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
