const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const fs = require('fs');
const f = '/evolution/store/messages/versus_fc89e34b2b_babdc262eb/3EB041BF29F28F4C12E982.json';
if (fs.existsSync(f)) {
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  const thumb = d.message?.imageMessage?.jpegThumbnail;
  console.log('Thumbnail exists:', Boolean(thumb));
  if (thumb) {
    if (typeof thumb === 'string') {
      console.log('Base64 sample:', thumb.slice(0, 50));
      console.log('Total length:', thumb.length);
    } else if (thumb.data) {
      const b64 = Buffer.from(thumb.data).toString('base64');
      console.log('Base64 sample from data:', b64.slice(0, 50));
      console.log('Total length:', b64.length);
    }
  }
}
`;
  conn.exec(`docker exec -i evolution-api node << 'EOF'\n${nodeScript}\nEOF\n`, (err, stream) => {
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
