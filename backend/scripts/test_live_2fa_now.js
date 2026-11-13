const axios = require('axios');

async function testLiveLogin() {
  console.log('Testando disparo do 2FA para o SuperAdmin no backend...');
  try {
    // Busca um usuário SuperAdmin e aciona o login
    const res = await axios.post('http://187.127.10.166:3001/auth/login', {
      email: 'hajaluzstudio@gmail.com',
      password: process.env.TEST_PASSWORD || '' // Se não tiver a senha aqui, chamamos o envio pelo twoFactorService
    });
    console.log('Resposta do login:', res.data);
  } catch (err) {
    console.log('Resposta:', err.response?.data || err.message);
  }
}

testLiveLogin();

