const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH conectado. Testando conexão de cliente Socket.io na porta 80 via Nginx...');
  const script = `
    node -e '
      const io = require("/root/verus/frontend/node_modules/socket.io-client");
      const socket = io("http://127.0.0.1", {
        path: "/socket.io/",
        transports: ["websocket"],
        timeout: 5000
      });
      socket.on("connect", () => {
        console.log("SUCESSO: Conectado via WebSocket nativo na porta 80! Socket ID:", socket.id);
        socket.disconnect();
        process.exit(0);
      });
      socket.on("connect_error", (err) => {
        console.error("ERRO ao conectar via websocket:", err.message);
        process.exit(1);
      });
    '
  `;
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => {
      process.stdout.write(d.toString());
      out += d;
    });
    stream.stderr.on('data', d => {
      process.stderr.write(d.toString());
      out += d;
    });
    stream.on('close', code => {
      console.log('Finalizado com código:', code);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

