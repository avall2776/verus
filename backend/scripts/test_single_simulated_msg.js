const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH conectado. Enviando 1 mensagem de teste simulada...');
  const script = `
    node -e '
      async function run() {
        const payload = {
          event: "messages.upsert",
          instance: "versus_fc89e34b2b_babdc262eb",
          data: {
            key: {
              remoteJid: "5511999990001@s.whatsapp.net",
              fromMe: false,
              id: "TEST_SINGLE_" + Date.now()
            },
            pushName: "Bot Teste Unitario",
            message: {
              conversation: "Teste unitário de envio simulado"
            },
            messageType: "conversation"
          }
        };
        const res = await fetch("http://127.0.0.1:3001/webhooks/evolution/fc89e34b-2bc5-462d-9bfd-45b06e1d0126", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("Status resposta webhook:", data);
      }
      run().catch(console.error);
    '
    sleep 2
    sudo -u postgres psql -d versus_db -c "SELECT id, content, status, \\"createdAt\\" FROM \\"Message\\" WHERE \\"providerMessageId\\" LIKE 'TEST_SINGLE_%' ORDER BY \\"createdAt\\" DESC LIMIT 1;"
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
