const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Medindo latência de consulta do banco local...');

  const commands = [
    `source /root/.versus_db_credentials`,
    `/usr/lib/postgresql/17/bin/psql "postgresql://versus_user:$LOCAL_DB_PASS@127.0.0.1:5432/versus_db" -c "\\timing on" -c "SELECT count(*) FROM \\"Message\\";" -c "SELECT count(*) FROM \\"Contact\\";" -c "SELECT id, name, email FROM \\"User\\" LIMIT 5;"`,
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', code => conn.end());
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

