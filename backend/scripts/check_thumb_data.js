const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const fs = require('fs');

const f1 = '/evolution/store/messages/versus_fc89e34b2b_babdc262eb/3EB041BF29F28F4C12E982.json';
const f2 = '/evolution/store/messages/versus_fc89e34b2b_babdc262eb/ACDA8410EDE422B9DEC8B20FEA2ACCF5.json';

if (fs.existsSync(f1)) {
  const data = JSON.parse(fs.readFileSync(f1, 'utf8'));
  console.log('F1 image caption:', data.message?.imageMessage?.caption);
  console.log('F1 has thumbnail:', Boolean(data.message?.imageMessage?.jpegThumbnail));
  if (data.message?.imageMessage?.jpegThumbnail) {
    const thumb = data.message.imageMessage.jpegThumbnail;
    console.log('Thumb type:', typeof thumb, thumb.data ? thumb.data.length : thumb.length);
  }
}

if (fs.existsSync(f2)) {
  const data = JSON.parse(fs.readFileSync(f2, 'utf8'));
  console.log('F2 video caption:', data.message?.videoMessage?.caption);
  console.log('F2 has thumbnail:', Boolean(data.message?.videoMessage?.jpegThumbnail));
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
