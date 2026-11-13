const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Executando envio do 2FA no formato rico atualizado...');

  const script = `
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const axios = require('axios');
  const crypto = require('crypto');

  async function send() {
    const user = await prisma.user.findFirst({
      where: { email: 'hajaluzstudio@gmail.com' },
      include: { tenant: true }
    });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tempToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.twoFactorVerification.create({
      data: {
        userId: user.id,
        email: user.email.toLowerCase(),
        tenantId: user.tenantId,
        code: otpCode,
        tempToken,
        targetPhone: '555491109159',
        expiresAt,
      }
    });

    const nowBr = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date());

    const message = [
      '🔐 *[VALLOR SECURITY] · Autorização de Acesso*',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '👤 *Usuário Solicitante:* *' + (user.name || 'Operador') + '*',
      '📧 *E-mail de Login:* *' + user.email + '*',
      '🏢 *Empresa / Tenant:* ' + (user.tenant?.name || 'Vallor Omnichannel'),
      '📍 *Local:* Passo Fundo, Rio Grande do Sul (IP: \`131.221.14.161\`)',
      '💻 *Dispositivo:* Google Chrome no Windows PC',
      '⏰ *Horário:* ' + nowBr,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '🔑 *SEU CÓDIGO DE AUTORIZAÇÃO:*',
      '👉 *' + otpCode + '*',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '⏱️ *Validade:* 10 minutos.',
      '⚠️ *Atenção:* Se você não autoriza este acesso ou não reconhece o usuário acima, não repasse este código.',
    ].join('\\n');

    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    const instance = await prisma.whatsAppInstance.findFirst({
      where: { status: 'connected', phoneNumber: { not: { contains: '91109159' } } }
    });

    const evoInstanceName = (instance?.settings)?.instanceName || 'versus_fc89e34b2b_babdc262eb';
    const apiKey = instance?.token || 'verto123';

    const res = await axios.post(evolutionUrl + '/message/sendText/' + evoInstanceName, {
      number: '555491109159',
      text: message,
      textMessage: { text: message }
    }, {
      headers: { apikey: apiKey, 'Content-Type': 'application/json' }
    });

    console.log('Envio concluído com status:', res.status, 'Código:', otpCode);
    await prisma.$disconnect();
  }

  send().catch(console.error);
  `;

  conn.exec(`node -e "${script.replace(/"/g, '\\"')}"`, (err, stream) => {
    if (err) {
      console.error('Erro na execução remota:', err);
      conn.end();
      return;
    }
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});
