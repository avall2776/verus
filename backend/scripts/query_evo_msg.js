const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const code = `
const http = require('http');

async function test() {
  // 1. Listar instâncias na Evolution
  const req = http.request({
    hostname: '127.0.0.1',
    port: 8080,
    path: '/instance/fetchInstances',
    method: 'GET',
    headers: { 'apikey': 'verto123' }
  }, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      console.log('Instances:', data);
      const instances = JSON.parse(data);
      const instName = instances[0]?.instance?.instanceName || instances[0]?.name;
      console.log('Using instance:', instName);
      
      // 2. Buscar mensagem por ID
      const postData = JSON.stringify({
        where: {
          id: "3AB0D72CF8F21AB34EAD"
        }
      });
      
      const findReq = http.request({
        hostname: '127.0.0.1',
        port: 8080,
        path: '/chat/findMessages/' + encodeURIComponent(instName),
        method: 'POST',
        headers: {
          'apikey': 'verto123',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (fRes) => {
        let fData = '';
        fRes.on('data', d => fData += d);
        fRes.on('end', () => {
          console.log('findMessages status:', fRes.statusCode);
          console.log('findMessages result:', fData);
        });
      });
      findReq.write(postData);
      findReq.end();
    });
  });
  req.end();
}
test().catch(console.error);
`;

  conn.exec(`cat << 'EOF' > /root/query_evo_msg.js\n${code}\nEOF\nnode /root/query_evo_msg.js`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
