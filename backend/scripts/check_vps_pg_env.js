const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Verificando ambiente da VPS para o PostgreSQL...');

  const commands = [
    'which psql || echo "psql: not installed"',
    'which pg_dump || echo "pg_dump: not installed"',
    'systemctl is-active postgresql || echo "postgresql: inactive/not installed"',
    'df -h /',
    'free -m',
    'cat /etc/os-release | grep PRETTY_NAME',
  ].join(' && echo "---" && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

