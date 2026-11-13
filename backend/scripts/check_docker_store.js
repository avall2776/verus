const { Client } = require('ssh2');

const scriptCode = `
const { execSync } = require('child_process');

try {
  // Ver se tem arquivos de store no container da Evolution
  const out = execSync("docker exec evolution-api ls -la /evolution/store", { encoding: 'utf8' });
  console.log('Store files:', out);
} catch (e) {
  console.log('Erro ao checar /evolution/store:', e.message);
}

try {
  const instances = execSync("docker exec evolution-api ls -la /evolution/instances", { encoding: 'utf8' });
  console.log('Instances files:', instances);
} catch (e) {
  console.log('Erro ao checar /evolution/instances:', e.message);
}
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/check_docker_store.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/check_docker_store.js', (err, stream) => {
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

