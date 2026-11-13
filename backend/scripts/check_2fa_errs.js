const { Client } = require('ssh2');

const scriptCode = `
const { execSync } = require('child_process');

try {
  const errLogs = execSync('grep -a "2FA_DISPATCH_ERROR" /root/.pm2/logs/*.log | tail -n 20', { encoding: 'utf8' });
  console.log('Erros 2FA encontrados:', errLogs);
} catch (e) {
  console.log('Sem erros grep 2FA_DISPATCH_ERROR:', e.message);
}
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/check_2fa_errs.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/check_2fa_errs.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => {
          console.log(out);
          conn.end();
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

