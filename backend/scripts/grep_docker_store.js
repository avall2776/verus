const { Client } = require('ssh2');

const scriptCode = "const { execSync } = require('child_process');\n" +
  "try {\n" +
  "  const msgs = execSync('docker exec evolution-api ls -la /evolution/store/messages/versus_fc89e34b2b_babdc262eb', { encoding: 'utf8' });\n" +
  "  console.log('Messages store files:', msgs.substring(0, 500));\n" +
  "} catch (e) {\n" +
  "  console.log('Erro messages store:', e.message);\n" +
  "}\n" +
  "try {\n" +
  "  const found = execSync('docker exec evolution-api grep -rn \"8783325601805\" /evolution/store/', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });\n" +
  "  console.log('Encontrado 8783325601805:', found.substring(0, 1000));\n" +
  "} catch (e) {\n" +
  "  console.log('Erro grep 8783325601805:', e.message.substring(0, 500));\n" +
  "}\n" +
  "try {\n" +
  "  const found = execSync('docker exec evolution-api grep -rn \"81363966\" /evolution/store/', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });\n" +
  "  console.log('Encontrado 81363966:', found.substring(0, 1000));\n" +
  "} catch (e) {\n" +
  "  console.log('Erro grep 81363966:', e.message.substring(0, 500));\n" +
  "}";

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/grep_docker_store.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/grep_docker_store.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => {
          console.log(out);
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});
