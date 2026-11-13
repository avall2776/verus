const { Client } = require('ssh2');

const scriptContent = `
const net = require('net');
const times = [];

function measure(i) {
  if (i >= 5) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log('TCP connect latency to Supabase (Ohio):', times, 'Average:', avg.toFixed(1), 'ms');
    return;
  }
  const t0 = Date.now();
  const s = net.createConnection({ host: 'aws-0-us-east-2.pooler.supabase.com', port: 5432 }, () => {
    times.push(Date.now() - t0);
    s.end();
    setTimeout(() => measure(i + 1), 100);
  });
  s.on('error', e => console.error(e));
}
measure(0);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/test_latency.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('node /root/test_latency.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/test_latency.js', () => conn.end());
        });
      });
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});

