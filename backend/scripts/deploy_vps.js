const os = require('os');
const path = require('path');
const fs = require('fs');
const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Obtendo detalhes do serviço...');
  conn.exec('pm2 jlist', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      try {
        const list = JSON.parse(out);
        const engine = list.find(p => p.name === 'versus-engine');
        console.log('App cwd:', engine?.pm2_env?.pm_cwd);
        console.log('App script:', engine?.pm2_env?.pm_exec_path);

        const cwd = engine?.pm2_env?.pm_cwd || '/root/VERSUS/backend';
        // Executar pull, prisma generate, build e restart
        const deployCmd = `cd ${cwd}/.. && git fetch origin main && git reset --hard origin/main && cd ${cwd} && npx prisma generate && npm run build && pm2 restart versus-engine`;
        console.log('Executando:', deployCmd);

        conn.exec(deployCmd, (err2, stream2) => {
          if (err2) throw err2;
          stream2.on('close', (code) => {
            console.log('Deploy concluído com código:', code);
            conn.end();
          }).on('data', d => process.stdout.write(d.toString()))
            .stderr.on('data', d => process.stderr.write(d.toString()));
        });
      } catch (e) {
        console.error('Erro ao parsear pm2 jlist:', e);
        conn.end();
      }
    }).on('data', d => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync(path.join(os.homedir(), '.ssh', 'id_ed25519'), 'utf8'),
});
