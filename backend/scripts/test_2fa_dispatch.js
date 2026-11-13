const axios = require('axios');

async function testDispatch() {
  console.log('Testando disparo do código de autorização 2FA via API do Backend na VPS...');
  try {
    // Chama o endpoint de login com o e-mail do SuperAdmin
    const res = await axios.post('http://187.127.10.166:3001/auth/login', {
      email: 'administrativoavall@gmail.com',
      password: '123' // Senha propositalmente para testar se dá erro ou se o usuário digita na tela
    });
    console.log('Resultado:', res.data);
  } catch (err) {
    console.log('Resposta esperada do backend:', err.response?.data || err.message);
  }
}

testDispatch();

