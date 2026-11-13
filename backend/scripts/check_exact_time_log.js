const { Client } = require('ssh2');

const scriptCode = `
const { execSync } = require('child_process');

try {
  // Buscar no log as linhas de 16:35 a 16:45 UTC (ou 13:35 a 13:45 BRT)
  const logs = execSync("grep -a -E '16:3[5-9]|16:4[0-5]' /root/.pm2/logs/versus-engine-out.log /root/.pm2/logs/versus-engine-error.log | tail -n 50", { encoding: 'utf8' });
  console.log('Logs do horário:', logs);
} catch (e) {
  console.log('Erro ao ler logs:', e.message);
}
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/check_exact_time_log.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/check_exact_time_log.js', (err, stream) => {
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

