const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `node -e '
    const axios = require("axios");
    async function testEvo() {
      try {
        const evoUrl = "http://localhost:8080";
        const apiKey = "verto123";
        const instance = "versus_fc89e34b2b_babdc262eb";

        const connState = await axios.get(\`\${evoUrl}/instance/connectionState/\${instance}\`, {
          headers: { apikey: apiKey }
        });
        console.log("=== EVOLUTION INSTANCE CONNECTION STATE ===");
        console.log(JSON.stringify(connState.data, null, 2));

        // Checar info da instância
        const info = await axios.get(\`\${evoUrl}/instance/fetchInstances?instanceName=\${instance}\`, {
          headers: { apikey: apiKey }
        });
        console.log("=== EVOLUTION INSTANCE INFO ===");
        console.log(JSON.stringify(info.data, null, 2));

      } catch (e) {
        console.error("ERRO AO TESTAR EVOLUTION:", e.response?.data || e.message);
      }
    }
    testEvo();
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
