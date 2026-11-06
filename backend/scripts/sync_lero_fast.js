const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TENANT_ID = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
const LERO_TOKEN = 't0MFpI8Ft-TVyThUIkZKTAp-MnYW7sZduvkCWaib9r0AiFghvobo-xlSgOIhOzO1';
const LERO_API = 'https://api.lero.pro';

const DEPTS = {
  REGIAO_1: '6dc14ed7-3074-40ec-89bb-88101906bf16', // RS, SC, PR (Plínio)
  REGIAO_2: '3c2d4199-baa6-4fa1-a3f7-13fd4d9b8ac6', // MS, MT, PA, RO, RR, AC, AM, AP (Janaína)
  REGIAO_3: 'fc38c816-071e-4dd3-8e88-4ee92454bdc7', // GO, MG, SP (Gabriel)
  REGIAO_4: '5909d298-5aeb-45a7-902b-edcb6a9df63b', // TO, BA
  REGIAO_5: '2d07e3fc-0ea2-4ed8-a2ab-c76414b8051d', // MA, PI
  REGIAO_6: '62ae09af-810c-44e8-830e-aae9f156e5ba', // CE, RN, PB, SE, PE, AL
  IA: '3fe995f3-6fc4-4e3a-bb22-72d328b606ea',
  COMERCIAL: 'c735ab57-dd57-4f86-b853-ff57b0c92847',
};

const STAGE_MAP = {
  '605e1970-cfff-4d5c-b527-fbef2c0f0d80': 'seed',          // LEADS SEED
  '509affc6-5441-408e-8a46-e384c4369b34': 'new',           // Novo Contato
  '1d9e7048-95cf-4cb9-ab51-3bbfdc2f981f': 'qualified',     // Em Qualificação
  'fed671a7-7057-491f-a640-8a704bf48b73': 'follow-up',     // followup
  '421cb14d-3a89-4984-a7d5-16b02963ade9': 'proposal',      // Proposta Enviada
  '1aa20107-5461-4b8f-8fe6-733f3c5445c6': 'negotiation',   // Negociação
  '731afcce-91a8-4682-883a-979f5efc0533': 'won',           // Fechado/Ganho
  '7c1f9fed-868e-41e4-a573-5fb6ef3e132b': 'lost',          // Fechado/Perdido
  '2073a5c7-1b8f-4aa1-810a-73d571cf6320': 'disqualified',  // Duplicados e Lead desqualificados
  'e9fc1873-ac24-4354-86a8-10d1e14cb8ab': 'ligacao-ativa',
};

const JANAINA_ID = '43e3ab2e-72c4-4518-8509-9685a8edd986';
const GABRIEL_ID = 'be372bc4-e72c-422b-a9ed-3ff19eea3b6e';
const PLINIO_ID  = '5353b252-8843-45b9-bd77-89e1e341dccd';

function normalizePhone(p) {
  if (!p) return null;
  const digits = String(p).replace(/\D/g, '');
  if (!digits || digits.length < 8) return null;
  if (digits.length === 10 || digits.length === 11) {
    return '55' + digits;
  }
  return digits;
}

function parseState(desc) {
  if (!desc) return null;
  const match = desc.match(/Estado:\s*([A-Za-z]{2})/i);
  if (match) return match[1].toUpperCase();
  return null;
}

function parseCity(desc) {
  if (!desc) return null;
  const match = desc.match(/Cidade:\s*([^\n\r]+)/i);
  if (match) return match[1].trim();
  return null;
}

function getDeptByState(uf) {
  if (!uf) return null;
  const s = uf.toUpperCase();
  if (['RS', 'SC', 'PR'].includes(s)) return DEPTS.REGIAO_1;
  if (['MS', 'MT', 'PA', 'RO', 'RR', 'AC', 'AM', 'AP'].includes(s)) return DEPTS.REGIAO_2;
  if (['GO', 'MG', 'SP'].includes(s)) return DEPTS.REGIAO_3;
  if (['TO', 'BA'].includes(s)) return DEPTS.REGIAO_4;
  if (['MA', 'PI'].includes(s)) return DEPTS.REGIAO_5;
  if (['CE', 'RN', 'PB', 'SE', 'PE', 'AL'].includes(s)) return DEPTS.REGIAO_6;
  return null;
}

function getDeptByDdd(phone) {
  if (!phone) return DEPTS.COMERCIAL;
  const d = normalizePhone(phone);
  if (!d || d.length < 4) return DEPTS.COMERCIAL;
  const ddd = d.startsWith('55') ? d.slice(2, 4) : d.slice(0, 2);
  const n = parseInt(ddd, 10);
  if ([51, 53, 54, 55, 47, 48, 49, 41, 42, 43, 44, 45, 46].includes(n)) return DEPTS.REGIAO_1;
  if ([67, 65, 66, 91, 93, 94, 69, 95, 68, 92, 97, 96].includes(n)) return DEPTS.REGIAO_2;
  if ([62, 64, 31, 32, 33, 34, 35, 37, 38, 11, 12, 13, 14, 15, 16, 17, 18, 19].includes(n)) return DEPTS.REGIAO_3;
  if ([63, 71, 73, 74, 75, 77].includes(n)) return DEPTS.REGIAO_4;
  if ([98, 99, 86, 89].includes(n)) return DEPTS.REGIAO_5;
  if ([85, 88, 84, 83, 79, 81, 87, 82].includes(n)) return DEPTS.REGIAO_6;
  return DEPTS.COMERCIAL;
}

async function apiFetchPaged(endpoint) {
  const all = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const url = `${LERO_API}${endpoint}?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${LERO_TOKEN}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const items = data.data || [];
    all.push(...items);
    if (items.length < limit || (data.meta && all.length >= data.meta.total)) break;
    offset += limit;
  }
  return all;
}

async function run() {
  console.log('🚀 Iniciando sincronização acelerada Lero -> Vallor...');
  const t0 = Date.now();

  // 1. Usuários
  const users = await prisma.user.findMany({
    where: { tenantId: TENANT_ID },
    select: { id: true, name: true, email: true }
  });
  const userMapByEmail = new Map(users.map(u => [u.email.toLowerCase(), u.id]));
  const userMapByName = new Map(users.map(u => [u.name.toLowerCase(), u.id]));

  // 2. Cards do Lero
  const cards = await apiFetchPaged('/functions/v1/api-funnels-handler/v1/funnels/cards');
  console.log(`Cards baixados do Lero: ${cards.length}`);

  // 3. Carregar todos contatos, deals e conversas em memória em paralelo
  const [contacts, existingDeals, existingConvs] = await Promise.all([
    prisma.contact.findMany({
      where: { tenantId: TENANT_ID },
      select: { id: true, phone: true, name: true, city: true, state: true }
    }),
    prisma.deal.findMany({
      where: { tenantId: TENANT_ID },
      select: { id: true, contactId: true, metadata: true }
    }),
    prisma.conversation.findMany({
      where: { tenantId: TENANT_ID },
      select: { id: true, contactId: true, status: true, departmentId: true, assignedTo: true }
    })
  ]);

  const contactByPhone = new Map();
  contacts.forEach(c => {
    if (c.phone) {
      const np = normalizePhone(c.phone);
      if (np) contactByPhone.set(np, c);
    }
  });

  const dealByContactId = new Map(existingDeals.map(d => [d.contactId, d]));
  const convByContactId = new Map(existingConvs.map(c => [c.contactId, c]));
  const seenConvContacts = new Set(existingConvs.map(c => c.contactId));

  console.log(`Indexados: ${contactByPhone.size} contatos, ${dealByContactId.size} deals, ${convByContactId.size} convs`);

  // 4. Preparar operações em lote
  const dealOps = [];
  const convOps = [];

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const cleanPhone = normalizePhone(card.phone);
    if (!cleanPhone) continue;

    const uf = parseState(card.description);
    const city = parseCity(card.description);
    let targetDept = getDeptByState(uf);

    let assignedUserId = null;
    if (card.assigned_user_email && userMapByEmail.has(card.assigned_user_email.toLowerCase())) {
      assignedUserId = userMapByEmail.get(card.assigned_user_email.toLowerCase());
    } else if (card.assigned_user_name && userMapByName.has(card.assigned_user_name.toLowerCase())) {
      assignedUserId = userMapByName.get(card.assigned_user_name.toLowerCase());
    }

    if (!targetDept) {
      if (card.assigned_user_email?.includes('comercialverto2') || card.assigned_user_name?.toLowerCase().includes('janaina')) {
        targetDept = DEPTS.REGIAO_2;
        assignedUserId = JANAINA_ID;
      } else if (card.assigned_user_email?.includes('gabrielcarmo') || card.assigned_user_name?.toLowerCase().includes('gabriel')) {
        targetDept = DEPTS.REGIAO_3;
        assignedUserId = GABRIEL_ID;
      } else if (card.assigned_user_email?.includes('comprasverto') || card.assigned_user_name?.toLowerCase().includes('plinio')) {
        targetDept = DEPTS.REGIAO_1;
        assignedUserId = PLINIO_ID;
      } else {
        targetDept = getDeptByDdd(cleanPhone);
      }
    }

    const stageStatus = STAGE_MAP[card.stage_id] || 'new';
    const cardInteractionDate = card.last_interaction_at ? new Date(card.last_interaction_at) : (card.updated_at ? new Date(card.updated_at) : new Date());

    let contact = contactByPhone.get(cleanPhone);
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          tenantId: TENANT_ID,
          name: card.title || cleanPhone,
          phone: cleanPhone,
          city: city || undefined,
          state: uf || undefined,
          source: 'Vallor CRM',
          tags: ['Lead'],
        }
      });
      contactByPhone.set(cleanPhone, contact);
    }

    const dealMeta = {
      position: card.position !== undefined && card.position !== null ? Number(card.position) : i,
      leroCardId: card.id,
      leroStageId: card.stage_id,
      dealCode: card.deal_code,
      dealNumber: card.deal_number,
      origin: card.description,
      startDate: card.start_date || card.created_at,
    };

    const exDeal = dealByContactId.get(contact.id);
    if (exDeal) {
      dealOps.push(
        prisma.deal.update({
          where: { id: exDeal.id },
          data: {
            title: card.title || undefined,
            status: stageStatus,
            value: card.deal_value ? String(card.deal_value) : undefined,
            assignedTo: assignedUserId || undefined,
            metadata: { ...(exDeal.metadata || {}), ...dealMeta },
            updatedAt: cardInteractionDate,
          }
        })
      );
    } else {
      dealOps.push(
        prisma.deal.create({
          data: {
            tenantId: TENANT_ID,
            contactId: contact.id,
            title: card.title || cleanPhone,
            status: stageStatus,
            value: card.deal_value ? String(card.deal_value) : '0',
            assignedTo: assignedUserId,
            metadata: dealMeta,
            createdAt: card.created_at ? new Date(card.created_at) : new Date(),
            updatedAt: cardInteractionDate,
          }
        })
      );
    }

    const exConv = convByContactId.get(contact.id);
    const isAi = exConv?.status === 'bot_active';
    const finalDept = isAi ? DEPTS.IA : targetDept;

    if (exConv) {
      convOps.push(
        prisma.conversation.update({
          where: { id: exConv.id },
          data: {
            departmentId: finalDept,
            assignedTo: assignedUserId || undefined,
            updatedAt: cardInteractionDate,
          }
        })
      );
    } else if (!seenConvContacts.has(contact.id)) {
      seenConvContacts.add(contact.id);
      convOps.push(
        prisma.conversation.create({
          data: {
            tenantId: TENANT_ID,
            contactId: contact.id,
            status: assignedUserId ? 'open' : 'waiting',
            departmentId: finalDept,
            assignedTo: assignedUserId,
            createdAt: card.created_at ? new Date(card.created_at) : new Date(),
            updatedAt: cardInteractionDate,
          }
        })
      );
    }
  }

  // Executa em chunks paralelos de 50
  console.log(`Processando ${dealOps.length} deals e ${convOps.length} conversas...`);
  const chunkSize = 50;
  for (let i = 0; i < dealOps.length; i += chunkSize) {
    await Promise.all(dealOps.slice(i, i + chunkSize));
  }
  console.log('✔ Deals atualizados com sucesso!');

  for (let i = 0; i < convOps.length; i += chunkSize) {
    await Promise.all(convOps.slice(i, i + chunkSize));
  }
  console.log('✔ Conversas atualizadas com sucesso!');

  // 5. Vincular contatos VIP do Inbox Lero
  console.log('Vinculando contatos prioritários...');

  // 5.1 Rodrigo Trojan (556699844152) -> Janaina (Região 2) - Topo
  const rodrigo = await prisma.contact.findFirst({
    where: { tenantId: TENANT_ID, OR: [{ phone: '556699844152' }, { phone: { contains: '99844152' } }] }
  });
  if (rodrigo) {
    await prisma.conversation.updateMany({
      where: { tenantId: TENANT_ID, contactId: rodrigo.id },
      data: {
        departmentId: DEPTS.REGIAO_2,
        assignedTo: JANAINA_ID,
        status: 'open',
        updatedAt: new Date(),
      }
    });
    console.log('✔ Rodrigo Trojan -> Janaína (Região 2) [Topo]');
  }

  // 5.2 Kasama -> Janaina (Região 2)
  const kasamaContacts = await prisma.contact.findMany({
    where: {
      tenantId: TENANT_ID,
      OR: [{ name: { contains: 'Kasama', mode: 'insensitive' } }, { phone: { contains: '991649243' } }, { phone: '157273229946927@lid' }]
    }
  });
  for (const kc of kasamaContacts) {
    await prisma.conversation.updateMany({
      where: { tenantId: TENANT_ID, contactId: kc.id },
      data: {
        departmentId: DEPTS.REGIAO_2,
        assignedTo: JANAINA_ID,
        status: 'open',
        updatedAt: new Date(Date.now() - 30 * 1000),
      }
    });
  }
  console.log(`✔ Kasama (${kasamaContacts.length} contatos) -> Janaína (Região 2)`);

  // 5.3 Gurski, Valcanaia, Stephan -> Janaina
  for (const name of ['Gurski', 'Valcanaia', 'Stephan']) {
    const cs = await prisma.contact.findMany({
      where: { tenantId: TENANT_ID, name: { contains: name, mode: 'insensitive' } }
    });
    for (const c of cs) {
      await prisma.conversation.updateMany({
        where: { tenantId: TENANT_ID, contactId: c.id },
        data: { departmentId: DEPTS.REGIAO_2, assignedTo: JANAINA_ID, status: 'open' }
      });
    }
  }

  // 5.4 Caio -> Gabriel (Região 3)
  const caioContacts = await prisma.contact.findMany({
    where: {
      tenantId: TENANT_ID,
      OR: [{ phone: '55246197923870@lid' }, { phone: { contains: '991284778' } }]
    }
  });
  for (const cc of caioContacts) {
    await prisma.conversation.updateMany({
      where: { tenantId: TENANT_ID, contactId: cc.id },
      data: { departmentId: DEPTS.REGIAO_3, assignedTo: GABRIEL_ID, status: 'open' }
    });
  }

  // 5.5 Rosicleia -> Janaina (Região 2)
  const rosiContacts = await prisma.contact.findMany({
    where: {
      tenantId: TENANT_ID,
      OR: [{ phone: '244787517083784@lid' }, { phone: { contains: '96058361' } }]
    }
  });
  for (const rc of rosiContacts) {
    await prisma.conversation.updateMany({
      where: { tenantId: TENANT_ID, contactId: rc.id },
      data: { departmentId: DEPTS.REGIAO_2, assignedTo: JANAINA_ID, status: 'open' }
    });
  }

  // 6. Eliminar qualquer departmentId nulo
  const nullDeptConvs = await prisma.conversation.findMany({
    where: { tenantId: TENANT_ID, departmentId: null },
    include: { contact: true }
  });
  for (const nc of nullDeptConvs) {
    const dept = getDeptByDdd(nc.contact?.phone) || DEPTS.COMERCIAL;
    await prisma.conversation.update({
      where: { id: nc.id },
      data: { departmentId: dept }
    });
  }

  console.log(`✨ Sincronização concluída com sucesso em ${((Date.now() - t0) / 1000).toFixed(1)}s!`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
