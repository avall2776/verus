const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    curl -s -X POST http://localhost:8080/webhook/set/versus_fc89e34b2b_babdc262eb \
      -H "apikey: verto123" \
      -H "Content-Type: application/json" \
      -d '{
        "enabled": true,
        "url": "http://172.16.0.1:3001/webhooks/evolution/fc89e34b-2bc5-462d-9bfd-45b06e1d0126",
        "webhook_by_events": false,
        "events": ["CONNECTION_UPDATE","QRCODE_UPDATED","MESSAGES_SET","MESSAGES_UPSERT","MESSAGES_UPDATE","RECEIPT_UPDATE","SEND_MESSAGE","CONTACTS_UPSERT","CHATS_UPSERT"]
      }'
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('Webhook set response:');
      console.log(out);
      conn.end();
    }).on('data', (d) => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
