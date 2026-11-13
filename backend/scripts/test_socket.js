const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `node -e '
    const axios = require("axios");
    async function testSocket() {
      try {
        const r = await axios.get("http://localhost:3001/socket.io/?EIO=4&transport=polling");
        console.log("Localhost 3001 socket.io status:", r.status, r.data);
      } catch (e) {
        console.log("Localhost 3001 socket.io error:", e.response?.status, e.response?.data || e.message);
      }
    }
    testSocket();
  '`;
  conn.exec(`cd /root/verus/backend && ${cmd}`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d))
      .stderr.on('data', d => process.stderr.write(d));
  });
}).on('error', console.error).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
