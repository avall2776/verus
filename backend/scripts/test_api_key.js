const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `cd /root/verus/backend && node -e '
    const axios = require("axios");
    async function test() {
      const url = "http://localhost:8080/instance/connectionState/versus_fc89e34b2b_babdc262eb";
      
      try {
        console.log("Testando com verto123 (Global Key):");
        const r1 = await axios.get(url, { headers: { apikey: "verto123" } });
        console.log("Sucesso:", r1.data);
      } catch (e) {
        console.log("Erro:", e.response?.status, e.response?.data);
      }

      try {
        console.log("Testando com verto_token_babdc262eb (Evo instance key):");
        const r2 = await axios.get(url, { headers: { apikey: "verto_token_babdc262eb" } });
        console.log("Sucesso:", r2.data);
      } catch (e) {
        console.log("Erro:", e.response?.status, e.response?.data);
      }

      try {
        console.log("Testando com tok_versus_fc89e34b2b_babdc262eb (DB token):");
        const r3 = await axios.get(url, { headers: { apikey: "tok_versus_fc89e34b2b_babdc262eb" } });
        console.log("Sucesso:", r3.data);
      } catch (e) {
        console.log("Erro:", e.response?.status, e.response?.data);
      }
    }
    test();
  '`;
  conn.exec(cmd, (err, stream) => {
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
