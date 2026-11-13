const { Client } = require('ssh2');

const remoteScript = `
const axios = require('/root/verus/backend/node_modules/axios');

async function run() {
  const evolutionUrl = 'http://localhost:8080';
  const evolutionGlobalKey = 'verto123';
  const instance = 'versus_fc89e34b2b_babdc262eb';

  console.log('=== 1. BUSCANDO TODOS OS GRUPOS / COMUNIDADES DA INSTANCIA ===');
  try {
    const res = await axios.get(evolutionUrl + '/group/fetchAllGroups/' + instance + '?getParticipants=true', {
      headers: { apikey: evolutionGlobalKey }
    });
    console.log('Total de grupos retornados:', Array.isArray(res.data) ? res.data.length : 'Nao e array');
    
    // Filtra pelo nome "Futuro"
    const grupos = Array.isArray(res.data) ? res.data : [];
    const futuroGrupos = grupos.filter(g => (g.subject || g.name || '').toLowerCase().includes('futuro'));
    console.log('Grupos encontrados com "Futuro":', futuroGrupos.length);
    for (const g of futuroGrupos) {
      console.log({
        id: g.id,
        subject: g.subject,
        creation: g.creation,
        owner: g.owner,
        desc: g.desc ? g.desc.substring(0, 100) : '',
        participantsCount: g.participants ? g.participants.length : 0,
        isCommunity: g.isCommunity,
        isCommunityAnnounce: g.isCommunityAnnounce,
        linkedParentJid: g.linkedParentJid
      });
      if (g.participants && g.participants.length > 0) {
        console.log('Exemplo primeiros 5 participantes:', g.participants.slice(0, 5));
      }
    }
  } catch (err) {
    console.log('Erro ao buscar grupos:', err.message, err.response?.data);
  }
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/check_community_contacts.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/check_community_contacts.js', (err, stream) => {
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

