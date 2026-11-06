const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TENANT_ID = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
const LERO_TOKEN = 't0MFpI8Ft-TVyThUIkZKTAp-MnYW7sZduvkCWaib9r0AiFghvobo-xlSgOIhOzO1';
const LERO_API = 'https://api.lero.pro';

const DEPTS = {
  REGIAO_1: '6dc14ed7-3074-40ec-89bb-88101906bf16', // RS, SC, PR
  REGIAO_2: '3c2d4199-baa6-4fa1-a3f7-13fd4d9b8ac6', // MS, MT, PA, RO, RR, AC, AM, AP
  REGIAO_3: 'fc38c816-071e-4dd3-8e88-4ee92454bdc7', // GO, MG, SP
  REGIAO_4: '5909d298-5aeb-45a7-902b-edcb6a9df63b', // TO, BA
  REGIAO_5: '2d07e3fc-0ea2-4ed8-a2ab-c76414b8051d', // MA, PI
  REGIAO_6: '62ae09af-810c-44e8-830e-aae9f156e5ba', // CE, RN, PB, SE, PE, AL
  IA: '3fe995f3-6fc4-4e3a-bb22-72d328b606ea',
  COMERCIAL: 'c735ab57-dd57-4f86-b853-ff57b0c92847',
};

const STAGE_MAP = {
  '605e1970-cfff-4d5c-b527-fbef2c0f0d80': 'seed',
  '509affc6-5441-408e-8a46-e384c4369b34': 'new',
  '1d9e7048-95cf-4cb9-ab51-3bbfdc2f981f': 'qualified',
  'fed671a7-7057-491f-a640-8a704bf48b73': 'follow-up',
  '421cb14d-3a89-4984-a7d5-16b02963ade9': 'proposal',
  '1aa20107-5461-4b8f-8fe6-733f3c5445c6': 'negotiation',
  '731afcce-91a8-4682-883a-979f5efc0533': 'won',
  '7c1f9fed-868e-41e4-a573-5fb6ef3e132b': 'lost',
  '2073a5c7-1b8f-4aa1-810a-73d571cf6320': 'disqualified',
  'e9fc1873-ac24-4354-86a8-10d1e14cb8ab': 'ligacao-ativa',
};

function normalizePhone(p) {
  if (!p) return null;
  const digits = String(p).replace(/\D/g, '');
  if (!digits || digits.length < 8) return null;
  // Pad standard Brazilian mobile if without country code
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
    await new Promise(r => setTimeout(r, 100));
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
    select: { id: true, name: true, email: true }
  });
  const userMapByEmail = new Map(users.map(u => [u.email.toLowerCase(), u.id]));
  const userMapByName = new Map(users.map(u => [u.name.toLowerCase(), u.id]));

  console.log(`Usuários encontrados no Vallor: ${users.length}`);
  users.forEach(u => console.log(` - ${u.name} (${u.email}) [ID: ${u.id}]`));

  // 2. Extrair todos os cards do Lero em tempo real
  console.log('\nBaixando cards de negociação do Lero...');
  const cards = await apiFetchPaged('/functions/v1/api-funnels-handler/v1/funnels/cards');
  console.log(`Total de cards obtidos do Lero: ${cards.length}`);

  // 3. Identificar contatos existentes no Vallor
  const dbContacts = await prisma.contact.findMany({
    where: { tenantId: TENANT_ID },
    include: {
      conversations: { select: { id: true, status: true, departmentId: true, assignedTo: true, updatedAt: true } },
      deals: { select: { id: true, status: true, title: true, value: true } }
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
  let reorderedConvs = 0;
  let deptMappedCount = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const cleanPhone = normalizePhone(card.phone);
    if (!cleanPhone) continue;

    // Detectar região pelo Estado do formulário
    const uf = parseState(card.description);
    const city = parseCity(card.description);
    let targetDept = getDeptByState(uf);

    // Mapear atendente responsável
    let assignedUserId = null;
    if (card.assigned_user_email && userMapByEmail.has(card.assigned_user_email.toLowerCase())) {
      assignedUserId = userMapByEmail.get(card.assigned_user_email.toLowerCase());
    } else if (card.assigned_user_name && userMapByName.has(card.assigned_user_name.toLowerCase())) {
      assignedUserId = userMapByName.get(card.assigned_user_name.toLowerCase());
    }

    // Se o estado não foi preenchido, usar o setor do atendente do Lero
    if (!targetDept) {
      if (card.assigned_user_email?.includes('comercialverto2')) {
        targetDept = DEPTS.REGIAO_2; // Janaina
      } else if (card.assigned_user_email?.includes('gabrielcarmo')) {
        targetDept = DEPTS.REGIAO_3; // Gabriel
      } else if (card.assigned_user_email?.includes('comprasverto')) {
        targetDept = DEPTS.REGIAO_1; // Plínio
      } else {
        targetDept = getDeptByDdd(cleanPhone);
      }
    }

    const stageStatus = STAGE_MAP[card.stage_id] || 'new';
    const cardInteractionDate = card.last_interaction_at ? new Date(card.last_interaction_at) : (card.updated_at ? new Date(card.updated_at) : new Date());

    let contact = contactByPhone.get(cleanPhone);
    if (!contact) {
      // Cria o contato estrito com seu telefone
      contact = await prisma.contact.create({
        data: {
          tenantId: TENANT_ID,
          name: card.title || cleanPhone,
          phone: cleanPhone,
          source: 'Vallor CRM',
          tags: ['Lead'],
          createdAt: card.created_at ? new Date(card.created_at) : new Date(),
          updatedAt: cardInteractionDate,
        },
        include: { conversations: true, deals: true }
      });
      contactByPhone.set(cleanPhone, contact);
    }

    // Atualizar / Criar Deal
    const existingDeal = contact.deals?.[0];
    if (existingDeal) {
      await prisma.deal.update({
        where: { id: existingDeal.id },
        data: {
          title: card.title || existingDeal.title,
          status: stageStatus,
          value: card.deal_value ? String(card.deal_value) : existingDeal.value,
          assignedTo: assignedUserId || existingDeal.assignedTo,
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
          createdAt: card.created_at ? new Date(card.created_at) : new Date(),
          updatedAt: cardInteractionDate,
        }
      });
      updatedDeals++;
    }

    // Atualizar / Criar Conversa (Ordem, Atendente e Região)
    let conv = contact.conversations?.[0];
    const isAi = conv?.status === 'bot_active';
    const finalDept = isAi ? DEPTS.IA : targetDept;

    if (conv) {
      await prisma.conversation.update({
        where: { id: conv.id },
        data: {
          departmentId: finalDept,
          assignedTo: assignedUserId,
          updatedAt: cardInteractionDate,
        }
      });
      updatedConvs++;
      deptMappedCount++;
    } else {
      await prisma.conversation.create({
        data: {
          tenantId: TENANT_ID,
          contactId: contact.id,
          status: assignedUserId ? 'open' : 'waiting',
          departmentId: finalDept,
          assignedTo: assignedUserId,
          createdAt: card.created_at ? new Date(card.created_at) : new Date(),
          updatedAt: cardInteractionDate,
        }
      });
      updatedConvs++;
      deptMappedCount++;
    }
  }

  // 4. Garantir que todas as conversas da IA fiquem com o departmentId da IA
  const aiConvs = await prisma.conversation.updateMany({
    where: {
      tenantId: TENANT_ID,
      status: 'bot_active',
      departmentId: { not: DEPTS.IA }
    },
    data: {
      departmentId: DEPTS.IA
    }
  });

  console.log(`\n================================================================`);
  console.log('✅ SINCRONIZAÇÃO MASTER CONCLUÍDA COM SUCESSO!');
  console.log(`- Deals/Negociações atualizadas: ${updatedDeals}`);
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
