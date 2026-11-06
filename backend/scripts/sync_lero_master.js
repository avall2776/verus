const fs = require('fs');
const path = require('path');
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
    await new Promise(r => setTimeout(r, 80));
  }
  return all;
}

async function main() {
  console.log('================================================================');
  console.log('🔄 INICIANDO AUDITORIA & SINCRONIZAÇÃO MASTER LERO -> VALLOR');
  console.log('================================================================');

  // 1. Carregar usuários do Vallor
  const users = await prisma.user.findMany({
    where: { tenantId: TENANT_ID },
    select: { id: true, name: true, email: true, role: true }
  });
  const userMapByEmail = new Map(users.map(u => [u.email.toLowerCase(), u.id]));
  const userMapByName = new Map(users.map(u => [u.name.toLowerCase(), u.id]));

  const JANAINA_ID = '43e3ab2e-72c4-4518-8509-9685a8edd986';
  const GABRIEL_ID = 'be372bc4-e72c-422b-a9ed-3ff19eea3b6e';
  const PLINIO_ID  = '5353b252-8843-45b9-bd77-89e1e341dccd';

  console.log(`Usuários encontrados no Vallor: ${users.length}`);
  users.forEach(u => console.log(` - ${u.name} (${u.email}) [ID: ${u.id}]`));

  // 2. Extrair todos os cards do Lero em tempo real
  console.log('\nBaixando cards de negociação do Lero...');
  const cards = await apiFetchPaged('/functions/v1/api-funnels-handler/v1/funnels/cards');
  console.log(`Total de cards obtidos do Lero: ${cards.length}`);

  // 3. Carregar contatos existentes no Vallor
  const dbContacts = await prisma.contact.findMany({
    where: { tenantId: TENANT_ID },
    include: {
      conversations: { select: { id: true, status: true, departmentId: true, assignedTo: true, updatedAt: true } },
      deals: { select: { id: true, status: true, title: true, value: true, metadata: true } }
    }
  });

  const contactByPhone = new Map();
  dbContacts.forEach(c => {
    if (c.phone) {
      const np = normalizePhone(c.phone);
      if (np) contactByPhone.set(np, c);
    }
  });
  console.log(`Contatos existentes no Vallor indexados por telefone: ${contactByPhone.size}`);

  let updatedDeals = 0;
  let updatedConvs = 0;
  let deptMappedCount = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const cleanPhone = normalizePhone(card.phone);
    if (!cleanPhone) continue;

    // Detectar região pelo Estado do formulário
    const uf = parseState(card.description);
    const city = parseCity(card.description);
    let targetDept = getDeptByState(uf);

    // Mapear atendente responsável do Lero
    let assignedUserId = null;
    if (card.assigned_user_email && userMapByEmail.has(card.assigned_user_email.toLowerCase())) {
      assignedUserId = userMapByEmail.get(card.assigned_user_email.toLowerCase());
    } else if (card.assigned_user_name && userMapByName.has(card.assigned_user_name.toLowerCase())) {
      assignedUserId = userMapByName.get(card.assigned_user_name.toLowerCase());
    }

    // Se o estado não foi preenchido, usar o setor do atendente do Lero
    if (!targetDept) {
      if (card.assigned_user_email?.includes('comercialverto2') || card.assigned_user_name?.toLowerCase().includes('janaina')) {
        targetDept = DEPTS.REGIAO_2;
        assignedUserId = JANAINA_ID;
      } else if (card.assigned_user_email?.includes('gabrielcarmo') || card.assigned_user_name?.toLowerCase().includes('gabriel')) {
        targetDept = DEPTS.REGIAO_3;
        assignedUserId = GABRIEL_ID;
      } else if (card.assigned_user_email?.includes('comprasverto') || card.assigned_user_name?.toLowerCase().includes('plinio') || card.assigned_user_name?.toLowerCase().includes('plínio')) {
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
          createdAt: card.created_at ? new Date(card.created_at) : new Date(),
          updatedAt: cardInteractionDate,
        },
        include: { conversations: true, deals: true }
      });
      contactByPhone.set(cleanPhone, contact);
    } else if (uf || city) {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          city: city || contact.city || undefined,
          state: uf || contact.state || undefined,
        }
      });
    }

    // Atualizar / Criar Deal com a EXATA POSIÇÃO e METADATA do Lero
    const dealMeta = {
      position: card.position !== undefined && card.position !== null ? Number(card.position) : i,
      leroCardId: card.id,
      leroStageId: card.stage_id,
      dealCode: card.deal_code,
      dealNumber: card.deal_number,
      origin: card.description,
      startDate: card.start_date || card.created_at,
      expectedCloseDate: card.expected_close_date,
    };

    const existingDeal = await prisma.deal.findFirst({
      where: { tenantId: TENANT_ID, contactId: contact.id }
    });

    if (existingDeal) {
      await prisma.deal.update({
        where: { id: existingDeal.id },
        data: {
          title: card.title || existingDeal.title,
          status: stageStatus,
          value: card.deal_value ? String(card.deal_value) : existingDeal.value,
          assignedTo: assignedUserId || existingDeal.assignedTo,
          metadata: { ...(existingDeal.metadata || {}), ...dealMeta },
          updatedAt: cardInteractionDate,
        }
      });
      updatedDeals++;
    } else {
      await prisma.deal.create({
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
      });
      updatedDeals++;
    }

    // Atualizar / Criar Conversa (Ordem, Atendente e Região)
    const existingConv = await prisma.conversation.findUnique({
      where: {
        tenantId_contactId: {
          tenantId: TENANT_ID,
          contactId: contact.id,
        }
      }
    });

    const isAi = existingConv?.status === 'bot_active';
    const finalDept = isAi ? DEPTS.IA : targetDept;

    await prisma.conversation.upsert({
      where: {
        tenantId_contactId: {
          tenantId: TENANT_ID,
          contactId: contact.id,
        }
      },
      create: {
        tenantId: TENANT_ID,
        contactId: contact.id,
        status: assignedUserId ? 'open' : 'waiting',
        departmentId: finalDept,
        assignedTo: assignedUserId,
        createdAt: card.created_at ? new Date(card.created_at) : new Date(),
        updatedAt: cardInteractionDate,
      },
      update: {
        departmentId: finalDept,
        assignedTo: assignedUserId || undefined,
        updatedAt: cardInteractionDate,
      }
    });
    updatedConvs++;
    deptMappedCount++;
  }

  // 4. ATRIBUIÇÃO ESPECÍFICA DOS CONTATOS VIP DO LERO INBOX:
  console.log('\nAlinhando contatos prioritários do Inbox Lero...');

  // 4.1 Rodrigo Trojan (556699844152) -> Janaina, Região 2, topo do inbox
  const rodrigoContact = await prisma.contact.findFirst({
    where: {
      tenantId: TENANT_ID,
      OR: [
        { phone: '556699844152' },
        { name: { contains: 'Rodrigo', mode: 'insensitive' }, phone: { contains: '99844152' } }
      ]
    }
  });
  if (rodrigoContact) {
    await prisma.conversation.updateMany({
      where: { tenantId: TENANT_ID, contactId: rodrigoContact.id },
      data: {
        departmentId: DEPTS.REGIAO_2,
        assignedTo: JANAINA_ID,
        status: 'open',
        updatedAt: new Date(Date.now() - 60 * 1000), // 1 min atrás -> Topo absoluto
      }
    });
    console.log(' Rodrigo Trojan vinculado com sucesso à Janaína Ribeiro (Região 2)!');
  }

  // 4.2 Kasama (Evandro Kasama e 157273229946927@lid) -> Janaina, Região 2
  const kasamaContacts = await prisma.contact.findMany({
    where: {
      tenantId: TENANT_ID,
      OR: [
        { name: { contains: 'Kasama', mode: 'insensitive' } },
        { phone: { contains: '991649243' } },
        { phone: '157273229946927@lid' },
      ]
    }
  });
  for (const kc of kasamaContacts) {
    await prisma.conversation.updateMany({
      where: { tenantId: TENANT_ID, contactId: kc.id },
      data: {
        departmentId: DEPTS.REGIAO_2,
        assignedTo: JANAINA_ID,
        status: 'open',
        updatedAt: new Date(Date.now() - 120 * 1000), // 2 min atrás
      }
    });
  }
  console.log(` Evandro Kasama (${kasamaContacts.length} contatos) vinculado à Janaína Ribeiro!`);

  // 4.3 Eder Gurski, Edson Valcanaia, Eduardo Stephan -> Janaina, Região 2
  const janainaVips = ['Gurski', 'Valcanaia', 'Stephan'];
  for (const jv of janainaVips) {
    const cs = await prisma.contact.findMany({
      where: { tenantId: TENANT_ID, name: { contains: jv, mode: 'insensitive' } }
    });
    for (const c of cs) {
      await prisma.conversation.updateMany({
        where: { tenantId: TENANT_ID, contactId: c.id },
        data: {
          departmentId: DEPTS.REGIAO_2,
          assignedTo: JANAINA_ID,
          status: 'open',
        }
      });
    }
  }

  // 4.4 Caio -> Gabriel Do Carmo (Região 3)
  const caioContacts = await prisma.contact.findMany({
    where: {
      tenantId: TENANT_ID,
      OR: [
        { phone: '55246197923870@lid' },
        { phone: { contains: '991284778' } }
      ]
    }
  });
  for (const cc of caioContacts) {
    await prisma.conversation.updateMany({
      where: { tenantId: TENANT_ID, contactId: cc.id },
      data: {
        departmentId: DEPTS.REGIAO_3,
        assignedTo: GABRIEL_ID,
        status: 'open',
      }
    });
  }

  // 4.5 Rosicleia -> Janaina (Região 2)
  const rosiContacts = await prisma.contact.findMany({
    where: {
      tenantId: TENANT_ID,
      OR: [
        { phone: '244787517083784@lid' },
        { phone: { contains: '96058361' } }
      ]
    }
  });
  for (const rc of rosiContacts) {
    await prisma.conversation.updateMany({
      where: { tenantId: TENANT_ID, contactId: rc.id },
      data: {
        departmentId: DEPTS.REGIAO_2,
        assignedTo: JANAINA_ID,
        status: 'open',
      }
    });
  }

  // 5. Garantir que NENHUMA conversa fique com departmentId null (atribui via DDD ou Comercial)
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
  console.log(` Conversas sem setor corrigidas: ${nullDeptConvs.length}`);

  // 6. Alinhar conversas ativas da IA
  const aiConvs = await prisma.conversation.updateMany({
    where: {
      tenantId: TENANT_ID,
      status: 'bot_active',
      departmentId: { not: DEPTS.IA }
    },
    data: { departmentId: DEPTS.IA }
  });

  console.log(`\n================================================================`);
  console.log('✅ SINCRONIZAÇÃO MASTER CONCLUÍDA COM SUCESSO!');
  console.log(`- Deals/Negociações atualizadas com posições do Lero: ${updatedDeals}`);
  console.log(`- Conversas alinhadas em ordem e atendentes: ${updatedConvs}`);
  console.log(`- Setores regionais mapeados: ${deptMappedCount}`);
  console.log(`- Conversas ativas de IA alinhadas ao Setor IA: ${aiConvs.count}`);
  console.log('================================================================');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Erro na sincronização master:', err);
  prisma.$disconnect();
});
