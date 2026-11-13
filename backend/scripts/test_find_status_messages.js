const axios = require('axios');

async function test() {
  const url = 'http://187.127.10.166:8080/chat/findMessages/versus_fc89e34b2b_babdc262eb';
  const headers = { apikey: 'verto123', 'Content-Type': 'application/json' };
  
  try {
    const res = await axios.post(url, {
      where: {
        key: {
          remoteJid: 'status@broadcast'
        }
      }
    }, { headers });
    console.log('findMessages status@broadcast result count:', Array.isArray(res.data) ? res.data.length : res.data);
    if (Array.isArray(res.data)) {
      console.log('Sample:', res.data.slice(0, 3));
    }
  } catch (err) {
    console.log('Error searching status@broadcast:', err.response?.data || err.message);
  }
}

test();
