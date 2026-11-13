const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const code = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("=== 1. VERIFICANDO MENSAGENS PENDENTES / ENGASGADAS NO BANCO DE HOJE ===");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pending = await prisma.message.findMany({
    where: {
      createdAt: { gte: today },
      direction: 'OUTBOUND',
      status: { notIn: ['delivered', 'read'] }
    },
    include: {
      contact: { select: { id: true, name: true, phone: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log("Total de mensagens OUTBOUND hoje não entregues/lidas:", pending.length);
  for (const m of pending) {
    console.log("  [" + m.createdAt.toISOString() + "] Tel: " + (m.contact?.phone || 'N/A') + " (" + (m.contact?.name || 'N/A') + ") | status=" + m.status + " | ID=" + m.id + " | ProvID=" + (m.providerMessageId || 'N/A') + " | " + m.content.substring(0, 45));
  }

  console.log("\\n=== 2. MENSAGENS COM PROVIDER_MESSAGE_ID NULO OU FALHA ===");
  const nullProv = await prisma.message.findMany({
    where: {
      createdAt: { gte: today },
      direction: 'OUTBOUND',
      providerMessageId: null
    },
    include: {
      contact: { select: { name: true, phone: true } }
    }
  });
  console.log("Mensagens sem providerMessageId:", nullProv.length);
  for (const m of nullProv) {
    console.log("  " + m.contact?.phone + " (" + m.contact?.name + "): " + m.content);
  }

  await prisma.$disconnect();
}
run().catch(console.error);
`;

  const bashScript = `
echo "=== PM2 RECENT ERRORS (LAST 50 LINES) ==="
tail -n 50 /root/.pm2/logs/versus-engine-error.log || echo "no error log"

echo "=== REDIS QUEUE STATUS ==="
redis-cli --scan --pattern "bull:*" | while read key; do
  type=$(redis-cli type "$key")
  if [ "$type" = "zset" ]; then
    count=$(redis-cli zcard "$key")
    if [ "$count" -gt 0 ]; then
      echo "ZSET $key : $count items"
    fi
  elif [ "$type" = "list" ]; then
    len=$(redis-cli llen "$key")
    if [ "$len" -gt 0 ]; then
      echo "LIST $key : $len items"
    fi
  fi
done

cd /root/verus/backend && node /root/verus/backend/audit_stuck_msgs.js
`;

  conn.exec(`cat << 'EOF' > /root/verus/backend/audit_stuck_msgs.js\n${code}\nEOF\n${bashScript}`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});

