const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const script = `
    sudo -u postgres psql -d versus_db -c "DELETE FROM \\"Message\\" WHERE \\"providerMessageId\\" LIKE 'STRESS_%' OR \\"providerMessageId\\" LIKE 'TEST_SINGLE_%';"
  `;
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', code => {
      console.log(out);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

