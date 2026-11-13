const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const fs = require('fs');
const path = require('path');
const dir = '/evolution/store/contacts/versus_fc89e34b2b_babdc262eb';
if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir);
  console.log('Total contact files in store:', files.length);
  const targets = [
    '127504710955167',
    '122522548838476',
    '38075052875866',
    '62302812397733',
    '153819992354947',
    '96843040075951',
    '277824925614103',
    '215847943540795',
    '174380000751701',
    '43212135755809',
    '31499474731238',
    '207052471279812',
    '192964324282466'
  ];
  for (const f of files) {
    for (const t of targets) {
      if (f.includes(t)) {
        console.log(f, '->', fs.readFileSync(path.join(dir, f), 'utf8'));
      }
    }
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
