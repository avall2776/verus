const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `node -e '
    const axios = require("axios");
    async function testStatus() {
      try {
        const evoUrl = "http://localhost:8080";
        const apiKey = "verto123";
        const instance = "versus_fc89e34b2b_babdc262eb";

        console.log("Testing POST /message/sendStatus with allContacts...");
        const res = await axios.post(
          \`\${evoUrl}/message/sendStatus/\${instance}\`,
          {
            statusMessage: {
              type: "image",
              content: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
              caption: "Teste Linha Verto Agro Stories",
              allContacts: true
            }
          },
          { headers: { apikey: apiKey, "Content-Type": "application/json" } }
        );
        console.log("SUCCESS:", res.data);
      } catch (e) {
        console.error("ERROR:", e.response?.data || e.message);
      }
    }
    testStatus();
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
