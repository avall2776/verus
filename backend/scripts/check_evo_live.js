const axios = require('axios');

async function checkEvo() {
  const evoUrl = 'http://187.127.10.166:8080';
  const apiKey = 'verto123';
  try {
    const res = await axios.get(`${evoUrl}/instance/fetchInstances`, {
      headers: { apikey: apiKey },
      timeout: 5000,
    });
    console.log('Instâncias ativas na Evolution API:');
    res.data.forEach(inst => {
      console.log(`- Nome: "${inst.name}" | Status: ${inst.connectionStatus} | Número: ${inst.ownerJid}`);
    });
  } catch (err) {
    console.error('Erro na Evolution API:', err.response?.data || err.message);
  }
}

checkEvo();

