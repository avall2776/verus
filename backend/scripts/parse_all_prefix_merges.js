const { exec } = require('child_process');

exec('grep -h "LID Mapeado por Prefixo" /root/.pm2/logs/*.log', { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
  const lines = stdout ? stdout.trim().split('\n') : [];
  console.log(`Total de ocorrências: ${lines.length}`);
  const uniqueMappings = new Map();
  for (const line of lines) {
    const match = line.match(/Remetente \[([^\]]+)\] \(([^)]+)\) -> Telefone Real: (\d+) \(([^)]+)\)/);
    if (match) {
      const [_, lid, remoteName, targetPhone, targetName] = match;
      const key = `${lid}->${targetPhone}`;
      if (!uniqueMappings.has(key)) {
        uniqueMappings.set(key, { lid, remoteName, targetPhone, targetName, raw: line });
      }
    }
  }

  console.log('\n=== MAPEAMENTOS ÚNICOS DETECTADOS ===');
  for (const [key, item] of uniqueMappings.entries()) {
    console.log(`LID: ${item.lid} | Nome Recebido: "${item.remoteName}" => Fundido com: "${item.targetName}" (${item.targetPhone})`);
  }
});

