const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const stages = [
    { id: "seed", title: "LEADS SEED", color: "text-cyan-400", bgLight: "bg-cyan-500/10", borderLight: "border-cyan-500/30", borderColor: "border-t-cyan-400" },
    { id: "new", title: "Novo Contato", color: "text-blue-500", bgLight: "bg-blue-500/10", borderLight: "border-blue-500/30", borderColor: "border-t-blue-500" },
    { id: "qualified", title: "Em Qualificação", color: "text-purple-500", bgLight: "bg-purple-500/10", borderLight: "border-purple-500/30", borderColor: "border-t-purple-500" },
    { id: "follow-up", title: "Follow-up", color: "text-yellow-500", bgLight: "bg-yellow-500/10", borderLight: "border-yellow-500/30", borderColor: "border-t-yellow-500" },
    { id: "ligacao-ativa", title: "LEADS LIGAÇÃO ATIVA", color: "text-indigo-400", bgLight: "bg-indigo-500/10", borderLight: "border-indigo-500/30", borderColor: "border-t-indigo-400" },
    { id: "proposal", title: "Proposta", color: "text-emerald-500", bgLight: "bg-emerald-500/10", borderLight: "border-emerald-500/30", borderColor: "border-t-emerald-500" },
    { id: "negotiation", title: "Negociação", color: "text-orange-500", bgLight: "bg-orange-500/10", borderLight: "border-orange-500/30", borderColor: "border-t-orange-500" },
    { id: "won", title: "Fechado/Ganho", color: "text-green-500", bgLight: "bg-green-500/10", borderLight: "border-green-500/30", borderColor: "border-t-green-500" },
    { id: "nao-atende", title: "NÃO ATENDE", color: "text-yellow-500", bgLight: "bg-yellow-500/10", borderLight: "border-yellow-500/30", borderColor: "border-t-yellow-500" },
    { id: "lost", title: "Fechado/Perdido", color: "text-rose-600", bgLight: "bg-rose-600/10", borderLight: "border-rose-600/30", borderColor: "border-t-rose-600" },
    { id: "disqualified", title: "Duplicados/Desqualificados", color: "text-slate-400", bgLight: "bg-slate-500/10", borderLight: "border-slate-500/30", borderColor: "border-t-slate-500" }
  ];

  const jsonStr = JSON.stringify(stages).replace(/'/g, "''");
  const sql = `UPDATE "Tenant" SET "crmStages" = '${jsonStr}'::jsonb WHERE id = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';\n`;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/seed_stages.sql');
    stream.write(sql);
    stream.end();
    stream.on('close', () => {
      conn.exec('sudo -u postgres psql -d versus_db -f /tmp/seed_stages.sql', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => {
          console.log('Output:\n', out);
          conn.end();
        });
      });
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });
