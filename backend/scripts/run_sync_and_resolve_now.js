const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteScript = `
    const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
    const axios = require('/root/verus/backend/node_modules/axios');
    const prisma = new PrismaClient();

    function normalizeContactName(s) {
      if (!s) return '';
      return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\\s+/g, ' ')
        .trim();
    }

    async function run() {
      const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
      const targetInstanceName = 'versus_fc89e34b2b_babdc262eb';
      const apiKey = 'verto_token_babdc262eb';

      console.log('1. Carregando contatos da Evolution...');
      const res = await axios.post('http://localhost:8080/chat/findContacts/' + targetInstanceName, {}, {
        headers: { apikey: apiKey, 'Content-Type': 'application/json' },
        timeout: 25000
      });
      const contacts = res.data || [];
      console.log('Total Evolution contacts:', contacts.length);

      const nameToContactMap = new Map();
      const picToContactMap = new Map();

      for (const ec of contacts) {
        if (!ec.id || ec.id.includes('@lid')) continue;
        const realPhone = ec.id.replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\\D/g, '');
        if (realPhone.length < 10 || realPhone.length > 13) continue;

        const candidateName = ec.pushName || ec.name;
        const norm = normalizeContactName(candidateName);
        if (norm && norm.length >= 3) {
          nameToContactMap.set(norm, {
            realPhone,
            name: candidateName,
            avatarUrl: ec.profilePictureUrl || null
          });
        }
      }

      console.log('Total no mapa de nomes:', nameToContactMap.size);

      // Carrega os contatos do banco com LID
      const lidContacts = await prisma.contact.findMany({
        where: {
          tenantId,
          OR: [
            { phone: { contains: 'lid' } },
            { name: { contains: 'lid' } },
            { whatsappLid: { not: null } },
            { phone: { startsWith: '17' } },
            { phone: { startsWith: '69' } },
            { phone: { startsWith: '78' } },
            { phone: { startsWith: '15' } },
            { phone: { startsWith: '21' } },
            { phone: { startsWith: '23' } },
            { phone: { startsWith: '81' } },
            { phone: null },
            { name: 'Cliente WhatsApp' },
            { name: 'Cliente Verto' }
          ]
        }
      });

      console.log('Contatos suspeitos/LID no DB:', lidContacts.length);
      let resolvedCount = 0;

      for (const contact of lidContacts) {
        const digits = (contact.phone || '').replace(/\\D/g, '');
        const hasValidPhone = digits.length >= 10 && digits.length <= 13 && !contact.phone.includes('@lid');
        if (hasValidPhone) continue;

        const inNormName = normalizeContactName(contact.name);
        let match = null;

        // Estratégia B1: Exato
        if (inNormName && inNormName.length >= 3) {
          match = nameToContactMap.get(inNormName);
        }

        // Estratégia B2: Prefixo
        if (!match && inNormName.split(' ').length >= 2 && inNormName.length >= 6) {
          for (const [candNorm, candData] of nameToContactMap.entries()) {
            if (candNorm.startsWith(inNormName + ' ') || inNormName.startsWith(candNorm + ' ')) {
              match = candData;
              break;
            }
          }
        }

        // Estratégia C: Base CRM
        if (!match && inNormName.split(' ').length >= 2 && inNormName.length >= 6) {
          const crmCandidates = await prisma.contact.findMany({
            where: {
              tenantId,
              phone: { not: null },
              NOT: { phone: { contains: 'lid' } },
              id: { not: contact.id }
            },
            select: { id: true, name: true, phone: true, avatarUrl: true }
          });
          for (const rc of crmCandidates) {
            const rcNorm = normalizeContactName(rc.name);
            if (rcNorm === inNormName || rcNorm.startsWith(inNormName + ' ') || inNormName.startsWith(rcNorm + ' ')) {
              const cleanRcPhone = (rc.phone || '').replace(/\\D/g, '');
              if (cleanRcPhone.length >= 10 && cleanRcPhone.length <= 13) {
                match = { realPhone: cleanRcPhone, name: rc.name, avatarUrl: rc.avatarUrl };
                break;
              }
            }
          }
        }

        if (match && match.realPhone) {
          console.log('Resolvendo [' + contact.name + '] (' + contact.phone + ') -> Telefone Real: ' + match.realPhone + ' (' + match.name + ')');
          
          const existingRealContact = await prisma.contact.findFirst({
            where: {
              tenantId,
              phone: match.realPhone,
              id: { not: contact.id }
            }
          });

          if (existingRealContact) {
            console.log(' -> Mesclando no contato real existente [' + existingRealContact.id + ']');
            // Mescla conversas
            const lidConvs = await prisma.conversation.findMany({ where: { contactId: contact.id } });
            for (const lidConv of lidConvs) {
              const realConv = await prisma.conversation.findFirst({
                where: { contactId: existingRealContact.id },
                orderBy: { updatedAt: 'desc' }
              });
              if (realConv) {
                await prisma.message.updateMany({
                  where: { conversationId: lidConv.id },
                  data: { conversationId: realConv.id, contactId: existingRealContact.id }
                });
                await prisma.csatSurvey.updateMany({
                  where: { conversationId: lidConv.id },
                  data: { conversationId: realConv.id, contactId: existingRealContact.id }
                }).catch(() => {});
                await prisma.aiLearningIncident.updateMany({
                  where: { conversationId: lidConv.id },
                  data: { conversationId: realConv.id }
                }).catch(() => {});
                await prisma.conversation.delete({ where: { id: lidConv.id } }).catch(() => {});
              } else {
                await prisma.conversation.update({
                  where: { id: lidConv.id },
                  data: { contactId: existingRealContact.id }
                });
              }
            }

            // Mensagens avulsas
            await prisma.message.updateMany({
              where: { contactId: contact.id },
              data: { contactId: existingRealContact.id }
            });

            // Deals & tickets
            await prisma.deal.updateMany({
              where: { contactId: contact.id },
              data: { contactId: existingRealContact.id }
            }).catch(() => {});
            await prisma.supportTicket.updateMany({
              where: { contactId: contact.id },
              data: { contactId: existingRealContact.id }
            }).catch(() => {});

            // Atualiza LID no contato real
            const realUpdate = {};
            if (!existingRealContact.whatsappLid) {
              realUpdate.whatsappLid = contact.whatsappLid || contact.phone;
            }
            if (!existingRealContact.avatarUrl && (match.avatarUrl || contact.avatarUrl)) {
              realUpdate.avatarUrl = match.avatarUrl || contact.avatarUrl;
            }
            if (Object.keys(realUpdate).length > 0) {
              await prisma.contact.update({
                where: { id: existingRealContact.id },
                data: realUpdate
              });
            }

            await prisma.contact.delete({ where: { id: contact.id } });
            resolvedCount++;
          } else {
            console.log(' -> Atualizando contato direto com telefone real ' + match.realPhone);
            await prisma.contact.update({
              where: { id: contact.id },
              data: {
                phone: match.realPhone,
                whatsappLid: contact.whatsappLid || contact.phone,
                name: (contact.name && !contact.name.includes('@lid')) ? contact.name : (match.name || contact.name),
                avatarUrl: match.avatarUrl || contact.avatarUrl
              }
            });
            resolvedCount++;
          }
        }
      }

      console.log('\\nCONCLUIDO! Total de contatos resolvidos/mesclados: ' + resolvedCount);
      await prisma.$disconnect();
    }
    run().catch(console.error);
  `;

  conn.exec(`node -e "${remoteScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('RESULTADO:\n' + out);
      conn.end();
    }).on('data', d => out += d).stderr.on('data', d => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
