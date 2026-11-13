const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('PGPASSWORD=versus_secure_pass psql -U versus_user -h 127.0.0.1 -d versus_db -c "SELECT count(*) FROM \\"PushSubscription\\";"', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', (d) => out += d);
    stream.stderr.on('data', (d) => out += 'STDERR: ' + d);
    stream.on('close', () => {
      console.log('PushSubscription query as versus_user:\n', out);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });
