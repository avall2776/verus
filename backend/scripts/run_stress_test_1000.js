const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH conectado. Preparando e executando TESTE DE CARGA EXTREMA DE 1.000 MENSAGENS...');
  const batchId = 'STRESS_' + Date.now();
  const script = `
    node -e '
      const batchId = "${batchId}";
      const totalMessages = 1000;
      const concurrency = 25;
      const tenantId = "fc89e34b-2bc5-462d-9bfd-45b06e1d0126";
      const webhookUrl = "http://127.0.0.1:3001/webhooks/evolution/" + tenantId;

      async function sendMsg(i) {
        const payload = {
          event: "messages.upsert",
          instance: "versus_fc89e34b2b_babdc262eb",
          data: {
            key: {
              remoteJid: "5511999990001@s.whatsapp.net",
              fromMe: false,
              id: batchId + "_" + i
            },
            pushName: "Stress Test Bot",
            message: {
              conversation: "Carga extrema Mensagem #" + i + " [" + batchId + "]"
            },
            messageType: "conversation"
          }
        };

        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status !== "queued") {
          throw new Error("Falha no envio da msg " + i + ": " + JSON.stringify(data));
        }
      }

      async function main() {
        console.log("🚀 Iniciando disparo de " + totalMessages + " mensagens (Concorrência: " + concurrency + ")...");
        const startTime = Date.now();
        let completed = 0;
        let errors = 0;

        const queue = Array.from({ length: totalMessages }, (_, i) => i + 1);

        async function worker() {
          while (queue.length > 0) {
            const index = queue.shift();
            if (!index) break;
            try {
              await sendMsg(index);
              completed++;
              if (completed % 100 === 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                const rate = (completed / elapsed).toFixed(1);
                console.log("  ↳ " + completed + "/" + totalMessages + " disparadas (" + rate + " msgs/seg)...");
              }
            } catch (err) {
              errors++;
              console.error("Erro msg " + index + ":", err.message);
            }
          }
        }

        const workers = Array.from({ length: concurrency }, () => worker());
        await Promise.all(workers);

        const totalElapsed = (Date.now() - startTime) / 1000;
        console.log("✅ Disparo HTTP concluído em " + totalElapsed.toFixed(2) + "s! Taxa média: " + (totalMessages / totalElapsed).toFixed(1) + " msgs/seg.");
        console.log("Sucessos HTTP:", completed, "| Erros HTTP:", errors);
      }

      main().catch(console.error);
    '

    echo "=== AGUARDANDO PROCESSAMENTO DA FILA NO REDIS (BULLMQ) ==="
    sleep 6

    echo "=== VERIFICANDO CONTAGEM NO BANCO DE DADOS POSTGRESQL ==="
    sudo -u postgres psql -d versus_db -c "SELECT COUNT(*) as total_salvas_no_banco FROM \\"Message\\" WHERE \\"providerMessageId\\" LIKE '${batchId}_%';"

    echo "=== VERIFICANDO STATUS DO WORKER E PM2 APÓS 1.000 MENSAGENS ==="
    pm2 status

    echo "=== LIMPEZA DE SEGURANÇA DAS 1.000 MENSAGENS DE TESTE DO BANCO ==="
    sudo -u postgres psql -d versus_db -c "DELETE FROM \\"Message\\" WHERE \\"providerMessageId\\" LIKE '${batchId}_%';"
    echo "=== TESTE DE CARGA FINALIZADO COM SUCESSO ==="
  `;
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => {
      process.stdout.write(d.toString());
      out += d;
    });
    stream.stderr.on('data', d => {
      process.stderr.write(d.toString());
      out += d;
    });
    stream.on('close', code => {
      console.log('\nFinalizado com código:', code);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

