const axios = require('axios');

async function main() {
  const evoUrl = 'http://127.0.0.1:8080';
  const apiKey = 'verto_token_babdc262eb';
  const instanceName = 'versus_fc89e34b2b_babdc262eb';

  console.log('--- BUSCANDO CONTATOS NA EVOLUTION API PARA', instanceName);
  try {
    const res = await axios.post(`${evoUrl}/chat/findContacts/${instanceName}`, {}, {
      headers: { apikey: apiKey }
    });
    console.log('Total contatos Evolution:', res.data?.length);

    // Search for 232959059693735 or 997777766 or Castilho
    const matches = res.data?.filter(c => 
      c.id?.includes('232959059693735') ||
      c.id?.includes('997777766') ||
      c.id?.includes('97777766') ||
      (c.pushName && c.pushName.toLowerCase().includes('castilho')) ||
      (c.name && c.name.toLowerCase().includes('castilho'))
    );
    console.log('Contatos encontrados:', JSON.stringify(matches, null, 2));

    // Also search for the LID specifically
    const lidMatch = res.data?.find(c => c.id?.includes('232959059693735'));
    console.log('LID match:', lidMatch);

    // Also let's check profile picture for 232959059693735@lid or 5518997777766
    try {
      const picRes = await axios.post(`${evoUrl}/chat/fetchProfilePictureUrl/${instanceName}`, {
        number: '5518997777766'
      }, { headers: { apikey: apiKey } });
      console.log('Foto de 5518997777766:', picRes.data);
    } catch (e) {
      console.log('Erro foto 5518997777766:', e.message);
    }

    try {
      const picRes2 = await axios.post(`${evoUrl}/chat/fetchProfilePictureUrl/${instanceName}`, {
        number: '232959059693735@lid'
      }, { headers: { apikey: apiKey } });
      console.log('Foto de 232959059693735@lid:', picRes2.data);
    } catch (e) {
      console.log('Erro foto 232959059693735@lid:', e.message);
    }

  } catch (e) {
    console.error('Erro na chamada:', e.message, e.response?.data);
  }
}

main().catch(console.error);
