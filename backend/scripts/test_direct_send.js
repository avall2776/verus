const axios = require('axios');

async function testSend() {
  const evoUrl = 'http://187.127.10.166:8080';
  const instanceName = 'versus_fc89e34b2b_babdc262eb'; // Comercial Verto
  const apiKey = 'verto_token_babdc262eb';
  const testPhone = '555491109159'; // Número normalizado 12 dígitos

  console.log(`Testando envio via ${instanceName} para ${testPhone}...`);
  try {
    const res = await axios.post(
      `${evoUrl}/message/sendText/${instanceName}`,
      {
        number: testPhone,
        text: '🛡️ [VALLOR SECURITY] - Teste de Conexão Master: Seu código é *490103*.',
        options: { delay: 500, presence: 'composing' },
        textMessage: { text: '🛡️ [VALLOR SECURITY] - Teste de Conexão Master: Seu código é *490103*.' }
      },
      {
        headers: { apikey: apiKey, 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    console.log('Sucesso:', res.data);
  } catch (err) {
    console.error('Erro ao enviar:', err.response?.data || err.message);
  }
}

testSend();

