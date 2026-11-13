const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('grep -C 5 "339af4fb-f288-4749-b3b1-c0318ea588b7" /root/.pm2/logs/versus-engine-out.log /root/.pm2/logs/versus-engine-error.log', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('Search by ID:');
      console.log(out);
      
      conn.exec('grep -C 5 "11:43:0" /root/.pm2/logs/versus-engine-out.log /root/.pm2/logs/versus-engine-error.log', (err2, stream2) => {
        let out2 = '';
        stream2.on('close', () => {
          console.log('Search by time 11:43:0:');
          console.log(out2);
          conn.end();
        }).on('data', d => out2 += d);
      });
    }).on('data', d => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});

