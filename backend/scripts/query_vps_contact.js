const { Client } = require('ssh2');
const fs = require('fs');

const scriptContent = `
const axios = require('axios');
async function query() {
  const evoUrl = 'http://localhost:8080';
  const apiKey = 'verto123';
  const instance = 'versus_fc89e34b2b_babdc262eb';
  const headers = { apikey: apiKey };

  console.log('--- 1. Querying contacts in Evolution ---');
  try {
    const res = await axios.post(evoUrl + '/chat/findContacts/' + instance, {}, { headers, timeout: 20000 });
    const list = Array.isArray(res.data) ? res.data : [];
    console.log('Total contacts in Evo:', list.length);
    const match = list.filter(c => {
      const str = JSON.stringify(c);
      return str.includes('81359444') || str.includes('214894427287688') || str.includes('Barichello') || str.includes('13709971861700');
    });
    console.log('Matching contacts in Evo:', JSON.stringify(match, null, 2));
  } catch (e) {
    console.error('Error findContacts:', e.message);
  }

  console.log('--- 2. Fetching profile for 555481359444 ---');
  try {
    const prof = await axios.post(evoUrl + '/chat/fetchProfile/' + instance, {
      number: '555481359444'
    }, { headers, timeout: 10000 });
    console.log('Profile 555481359444:', prof.data);
  } catch (e) {
    console.error('Error fetchProfile 555481359444:', e.response?.data || e.message);
  }

  console.log('--- 3. Fetching profile for 214894427287688@lid ---');
  try {
    const profLid = await axios.post(evoUrl + '/chat/fetchProfile/' + instance, {
      number: '214894427287688@lid'
    }, { headers, timeout: 10000 });
    console.log('Profile LID:', profLid.data);
  } catch (e) {
    console.error('Error fetchProfile LID:', e.response?.data || e.message);
  }

  console.log('--- 4. Fetching chats in Evolution ---');
  try {
    const chats = await axios.post(evoUrl + '/chat/findChats/' + instance, {}, { headers, timeout: 10000 });
    const chatList = Array.isArray(chats.data) ? chats.data : [];
    const matchChats = chatList.filter(c => {
      const str = JSON.stringify(c);
      return str.includes('81359444') || str.includes('214894427287688') || str.includes('Barichello');
    });
    console.log('Matching chats in Evo:', JSON.stringify(matchChats, null, 2));
  } catch (e) {
    console.error('Error findChats:', e.message);
  }
}
query();
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/query_evo.js');
    stream.write(scriptContent);
    stream.end(() => {
      conn.exec('NODE_PATH=/root/verus/backend/node_modules node /tmp/query_evo.js', (err, proc) => {
        if (err) throw err;
        proc.on('close', () => conn.end())
          .on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
      });
    });
  });
}).on('error', console.error).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
