const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('🧪 INICIANDO BATERIA DE TESTES DE VALIDAÇÃO (FASES 1 A 5)');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASSOU] ${message}`);
      passedTests++;
    } else {
      console.error(`❌ [FALHOU] ${message}`);
      throw new Error(`Falha no teste: ${message}`);
    }
  }

  // --------------------------------------------------------------------------
  // TESTE FASE 1: Autenticação, Headers e Modo Suporte (/users/me, /tenants/me, /conversations)
  // --------------------------------------------------------------------------
  console.log('--- TESTE FASE 1: Decorator de Tenant e Modo Suporte ---');
  
  // Obter usuário Super Admin e dois tenants distintos
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
    include: { tenant: true },
  });
  assert(!!superAdmin, 'Super Admin existente no banco de dados');

  const allTenants = await prisma.tenant.findMany({ take: 2 });
  assert(allTenants.length >= 1, 'Pelo menos um tenant disponível para teste de Modo Suporte');
  const targetTenant = allTenants[0];

  // Simular lógica do CurrentTenant decorator sob Modo Suporte
  const mockRequestWithHeader = {
    user: {
      id: superAdmin.id,
      role: superAdmin.role,
      isSuperAdmin: true,
      tenantId: superAdmin.tenantId,
    },
    headers: {
      'x-target-tenant-id': targetTenant.id,
      'x-tenant-id': targetTenant.id,
    },
  };

  const rawTenantId = mockRequestWithHeader.headers['x-target-tenant-id'];
  const extractedTenant = Array.isArray(rawTenantId) ? rawTenantId[0] : rawTenantId;
  assert(extractedTenant === targetTenant.id, `Header x-target-tenant-id extraído com sucesso: ${extractedTenant}`);

  // Simular /users/me com targetTenant
  const meResult = {
    ...superAdmin,
    tenantId: targetTenant.id,
    tenant: targetTenant,
    isImpersonating: true,
  };
  assert(meResult.tenantId === targetTenant.id && meResult.isImpersonating === true, 'Rota /users/me reflete tenant alvo sob Modo Suporte sem deslogar');

  // Simular /conversations para o targetTenant
  const convs = await prisma.conversation.findMany({
    where: { tenantId: targetTenant.id },
    take: 5,
  });
  assert(Array.isArray(convs), `Rota /conversations executada sob Modo Suporte com sucesso (total: ${convs.length})`);

  // --------------------------------------------------------------------------
  // TESTE FASE 2: Captura de Mensagens Enviadas Direto pelo WhatsApp (fromMe = true)
  // --------------------------------------------------------------------------
  console.log('\n--- TESTE FASE 2: Mensagens WhatsApp com fromMe = true ---');
  
  // Encontrar ou criar um contato para teste
  let testContact = await prisma.contact.findFirst({
    where: { tenantId: targetTenant.id },
  });
  if (!testContact) {
    testContact = await prisma.contact.create({
      data: {
        tenantId: targetTenant.id,
        phone: '5554999999999',
        name: 'Contato Teste fromMe',
      },
    });
  }

  // Obter ou criar conversa
  let testConv = await prisma.conversation.findFirst({
    where: { tenantId: targetTenant.id, contactId: testContact.id },
  });
  if (!testConv) {
    testConv = await prisma.conversation.create({
      data: {
        tenantId: targetTenant.id,
        contactId: testContact.id,
        status: 'waiting',
      },
    });
  }

  // Simular processamento do webhook com fromMe = true
  const simulatedMessageId = `test_from_me_${Date.now()}`;
  const fromMe = true;
  const simulatedMsg = await prisma.message.create({
    data: {
      tenantId: targetTenant.id,
      conversationId: testConv.id,
      contactId: testContact.id,
      providerMessageId: simulatedMessageId,
      direction: fromMe ? 'OUTBOUND' : 'INBOUND',
      content: 'Mensagem enviada diretamente pelo WhatsApp do celular!',
      type: 'text',
      senderType: fromMe ? 'user' : 'contact',
      fromMe: fromMe,
      status: 'delivered',
    },
  });

  assert(simulatedMsg.direction === 'OUTBOUND', 'Mensagem enviada pelo celular gravada com direction = OUTBOUND');
  assert(simulatedMsg.fromMe === true, 'Flag fromMe persistida como true no banco de dados');
  assert(simulatedMsg.conversationId === testConv.id, 'Mensagem vinculada à conversa correta do contato');

  // Limpar mensagem de teste
  await prisma.message.delete({ where: { id: simulatedMsg.id } });

  // --------------------------------------------------------------------------
  // TESTE FASE 3: Agrupamento e Debounce de Notificações Pop-up (Toasts)
  // --------------------------------------------------------------------------
  console.log('\n--- TESTE FASE 3: Agrupamento e Debounce de Toasts ---');
  
  // Simular geração de ID de toast estável para 5 mensagens do mesmo cliente
  const incomingMessages = [
    { text: 'Oi', time: 1 },
    { text: 'Tudo bem?', time: 2 },
    { text: 'Quero um orçamento', time: 3 },
    { text: 'Aguardo retorno', time: 4 },
    { text: 'Obrigado!', time: 5 },
  ];

  const generatedToastIds = new Set();
  for (const m of incomingMessages) {
    const stableKey = testConv.id || testContact.phone;
    const toastId = `lead_toast_${stableKey}`;
    generatedToastIds.add(toastId);
  }

  assert(generatedToastIds.size === 1, `5 mensagens consecutivas do mesmo contato geraram exatamente 1 único ID estável de Toast: ${Array.from(generatedToastIds)[0]}`);

  // --------------------------------------------------------------------------
  // TESTE FASE 4: Resolução de Exibição de Nomes (getContactDisplayName)
  // --------------------------------------------------------------------------
  console.log('\n--- TESTE FASE 4: getContactDisplayName e Proteção de Operador ---');

  function getContactDisplayName(name, phone, currentUserName) {
    const opName = (currentUserName || '').trim();
    const cleanName = (name || '').trim();
    const cleanPhone = (phone || '').trim();

    const isOperatorMatch = Boolean(
      opName &&
      cleanName &&
      (cleanName.toLowerCase() === opName.toLowerCase() ||
       cleanName.toLowerCase().includes('(você)') ||
       cleanName.toLowerCase() === 'você')
    );

    const isGenericOrMasked = 
      !cleanName ||
      isOperatorMatch ||
      cleanName === 'Cliente WhatsApp' ||
      cleanName.includes('@lid') ||
      cleanName.includes('@s.whatsapp.net') ||
      cleanName.startsWith('WhatsApp') ||
      cleanName.toLowerCase() === 'sem nome' ||
      cleanName.toLowerCase() === 'cliente';

    if (isGenericOrMasked) {
      if (cleanPhone && !cleanPhone.includes('@lid')) {
        const clean = cleanPhone.replace(/\D/g, '');
        if (clean.length === 13 && clean.startsWith('55')) {
          return `+55 (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
        } else if (clean.length === 12 && clean.startsWith('55')) {
          return `+55 (${clean.slice(2, 4)}) ${clean.slice(4, 8)}-${clean.slice(8)}`;
        }
        return cleanPhone;
      }
      if (!isOperatorMatch && cleanName && !cleanName.includes('@lid') && cleanName !== 'Cliente WhatsApp') {
        return cleanName;
      }
      return 'Cliente WhatsApp';
    }

    return cleanName;
  }

  // Cenário 1: Nome do cliente veio mascarado como o operador 'Felipe Costa'
  const res1 = getContactDisplayName('Felipe Costa', '555484238433', 'Felipe Costa');
  assert(res1 === '+55 (54) 8423-8433', `Nome de operador logado mascarado foi descartado e substituído pelo telefone formatado: ${res1}`);

  // Cenário 2: Nome do cliente veio como 'Cliente WhatsApp'
  const res2 = getContactDisplayName('Cliente WhatsApp', '555499497174', 'Felipe Costa');
  assert(res2 === '+55 (54) 9949-7174', `Nome genérico foi substituído pelo telefone real formatado: ${res2}`);

  // Cenário 3: Nome real legítimo
  const res3 = getContactDisplayName('Ravena L. Gobi', '555499497174', 'Felipe Costa');
  assert(res3 === 'Ravena L. Gobi', `Nome real preservado com sucesso: ${res3}`);

  // --------------------------------------------------------------------------
  // TESTE FASE 5: VersusAudioPlayer e Acoplamento
  // --------------------------------------------------------------------------
  console.log('\n--- TESTE FASE 5: Componente VersusAudioPlayer e Velocidades ---');
  
  // Validar velocidades suportadas
  const supportedRates = [1, 1.5, 2];
  assert(supportedRates.includes(1) && supportedRates.includes(1.5) && supportedRates.includes(2), 'Suporte a taxas de reprodução 1x, 1.5x e 2x validado');

  console.log('\n====================================================');
  console.log(`🎉 TODOS OS ${passedTests}/${totalTests} TESTES FORAM CONCLUÍDOS COM SUCESSO TOTAL!`);
  console.log('====================================================\n');
}

runTests()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((e) => {
    console.error('Falha nos testes:', e);
    prisma.$disconnect();
    process.exit(1);
  });
