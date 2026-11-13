const axios = require('axios');

async function checkMessageDelivery() {
  const evoUrl = 'http://187.127.10.166:8080';
  const instanceName = 'versus_fc89e34b2b_babdc262eb';
  const apiKey = 'verto_token_babdc262eb';
  try {
    const res = await axios.post(`${evoUrl}/chat/findMessages/${instanceName}`, {
      where: {
        key: {
          id: '3EB096A2C12CA722C26D1C'
        }
      }
    }, {
      headers: { apikey: apiKey }
    });
    console.log('Status da mensagem de teste na Evolution:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Erro ao buscar status:', err.response?.data || err.message);
  }
}

checkMessageDelivery();

