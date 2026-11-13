const { exec } = require('child_process');

console.log('=== AUDITORIA DE LOGS PM2: MAPEAMENTOS POR PREFIXO / NOME / MERGE ===\n');

const commands = [
  'grep -h "LID Mapeado por Prefixo" /root/.pm2/logs/*.log',
  'grep -h "LID Mapeado por Base CRM" /root/.pm2/logs/*.log',
  'grep -h "LID Resolution Merge" /root/.pm2/logs/*.log',
  'grep -h "LID Mapeado por Foto" /root/.pm2/logs/*.log'
];

let remaining = commands.length;
const results = {};

commands.forEach(cmd => {
  exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
    results[cmd] = stdout ? stdout.trim().split('\n') : [];
    remaining--;
    if (remaining === 0) {
      for (const [c, lines] of Object.entries(results)) {
        console.log(`\n--- COMANDO: ${c} --- (Total: ${lines.length})`);
        lines.slice(0, 50).forEach(l => console.log(l));
        if (lines.length > 50) {
          console.log(`... e mais ${lines.length - 50} ocorrências.`);
        }
      }
    }
  });
});

