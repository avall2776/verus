require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const items = await prisma.quickReply.findMany({
    where: { tenantId },
    select: {
      id: true,
      shortcut: true,
      title: true,
      fileName: true,
      type: true,
      content: true,
      mediaUrl: true,
    },
  });

  // Let's test classifying all items into products
  const productConfigs = [
    {
      shortcut: '/apresentacao',
      title: 'Apresentação Verto',
      content: 'Apresentação Verto Soluções Agrícolas',
      defaultType: 'document',
      match: (it) => it.shortcut.includes('apresentacao') || (it.title && it.title.toLowerCase().includes('apresentação')),
      cleanFileName: 'Apresentacao_Verto_Solucoes_Agricolas.pdf'
    },
    {
      shortcut: '/caixasuspensa',
      title: 'Caixas suspensas V-UP',
      content: 'Segue retrofit Massey ferguson 11 Linhas - Caixas suspensas',
      defaultType: 'image',
      match: (it) => it.shortcut.includes('caixa_suspensa') || it.shortcut.includes('caixa_no_cafe') || (it.title && it.title.toLowerCase().includes('caixa')),
      cleanPrefix: 'Caixas_Suspensas_VUP'
    },
    {
      shortcut: '/caseeazyriser',
      title: 'Case Eazy Riser',
      content: 'Segue linha Versátil instalada na plantadeira Case Eazy Riser - 15 linhas',
      defaultType: 'image',
      match: (it) => (it.title && it.title.toLowerCase().includes('eazy')) || it.shortcut.includes('eazy'),
      cleanPrefix: 'Case_Eazy_Riser_15L'
    },
    {
      shortcut: '/casefastriser',
      title: 'Case Fast Riser',
      content: 'Segue linha Versátil instalada na plantadeira Case Fast Riser - 48 linhas',
      defaultType: 'image',
      match: (it) => (it.title && it.title.toLowerCase().includes('fast')) || it.shortcut.includes('fast'),
      cleanPrefix: 'Case_Fast_Riser_48L'
    },
    {
      shortcut: '/escarificadorgts',
      title: 'Escarificador GTS',
      content: 'Segue: Versátil GRAN instalada em Escarificador GTS',
      defaultType: 'video',
      match: (it) => it.shortcut.includes('escarificador') || (it.title && it.title.toLowerCase().includes('escarificador')),
      cleanPrefix: 'Escarificador_GTS_Versatil'
    },
    {
      shortcut: '/staras44e40',
      title: 'Staras 44 e 40 Linhas MT',
      content: 'Segue linha Versátil instalada em Staras 44 e 40 Linhas',
      defaultType: 'image',
      match: (it) => it.shortcut.includes('2_staras_44_e_40') || (it.title && it.title.toLowerCase().includes('staras 44 e 40')),
      cleanPrefix: 'Stara_44_40_Linhas'
    },
    {
      shortcut: '/staraabsoluta',
      title: 'Stara Absoluta',
      content: 'Segue linha Versátil instalada na plantadeira Stara Absoluta',
      defaultType: 'image',
      match: (it) => it.shortcut.includes('staraabsoluta') || it.shortcut.includes('2staraabsoluta') || (it.title && it.title.toLowerCase().includes('absoluta')),
      cleanPrefix: 'Stara_Absoluta_Verto'
    },
    {
      shortcut: '/staraprincesa',
      title: 'Stara Princesa e Cinderela',
      content: 'Segue linha Versátil instalada na plantadeira Stara Princesa / Cinderela',
      defaultType: 'video',
      match: (it) => it.shortcut.includes('princesa') || (it.title && it.title.toLowerCase().includes('princesa')),
      cleanPrefix: 'Stara_Princesa_Cinderela'
    },
    {
      shortcut: '/johndeeredb43',
      title: 'John Deere DB 43 Linhas',
      content: 'Segue linha Versátil instalada na plantadeira John Deere DB 43 Linhas',
      defaultType: 'image',
      match: (it) => it.shortcut.includes('db_43') || (it.title && it.title.toLowerCase().includes('db 43')),
      cleanPrefix: 'John_Deere_DB43'
    },
    {
      shortcut: '/johndeere1113',
      title: 'John Deere 1113 Tandem',
      content: 'Segue linha Versátil instalada na plantadeira John Deere 1113 Tandem',
      defaultType: 'image',
      match: (it) => it.shortcut.includes('1113') || (it.title && it.title.toLowerCase().includes('1113')),
      cleanPrefix: 'John_Deere_1113'
    },
    {
      shortcut: '/momentum30',
      title: 'Momentum 30 Linhas',
      content: 'Segue linha Versátil instalada na plantadeira Momentum 30 Linhas',
      defaultType: 'image',
      match: (it) => (it.shortcut.includes('momentum') && it.shortcut.includes('30')) || (it.title && it.title.toLowerCase().includes('momentum 30')),
      cleanPrefix: 'Momentum_30_Linhas'
    },
    {
      shortcut: '/momentum40',
      title: 'Momentum 40 Linhas',
      content: 'Segue linha Versátil instalada na plantadeira Momentum 40 Linhas',
      defaultType: 'image',
      match: (it) => (it.shortcut.includes('momentum') && it.shortcut.includes('40')) || (it.title && it.title.toLowerCase().includes('momentum 40')),
      cleanPrefix: 'Momentum_40_Linhas'
    },
    {
      shortcut: '/newhollandpl6000',
      title: 'New Holland PL 6000',
      content: 'Segue linha Versátil instalada na plantadeira New Holland PL 6000',
      defaultType: 'image',
      match: (it) => it.shortcut.includes('pl_6000') || it.shortcut.includes('pl6000') || (it.title && it.title.toLowerCase().includes('pl 6000')),
      cleanPrefix: 'New_Holland_PL6000'
    },
    {
      shortcut: '/planticenterfragata',
      title: 'Planticenter Fragata',
      content: 'Segue linha Versátil instalada na plantadeira Planticenter Fragata',
      defaultType: 'image',
      match: (it) => it.shortcut.includes('planticenter') || (it.title && it.title.toLowerCase().includes('planticenter')),
      cleanPrefix: 'Planticenter_Fragata'
    },
    {
      shortcut: '/civemasa',
      title: 'Grade Civemasa',
      content: 'Segue linha Versátil instalada na Grade Civemasa',
      defaultType: 'image',
      match: (it) => it.shortcut.includes('civemasa') || (it.title && it.title.toLowerCase().includes('civemasa')),
      cleanPrefix: 'Grade_Civemasa'
    },
    {
      shortcut: '/gradeecoagricola',
      title: 'Grade Ecoagrícola',
      content: 'Segue linha Versátil instalada na Grade Ecoagrícola',
      defaultType: 'image',
      match: (it) => it.shortcut.includes('ecoagricola') || (it.title && it.title.toLowerCase().includes('ecoagricola')),
      cleanPrefix: 'Grade_Ecoagricola'
    },
    {
      shortcut: '/gradepiccin',
      title: 'Grade Piccin 72 Discos',
      content: 'Segue linha Versátil instalada na Grade Piccin 72 Discos',
      defaultType: 'video',
      match: (it) => it.shortcut.includes('piccin') || (it.title && it.title.toLowerCase().includes('piccin')),
      cleanPrefix: 'Grade_Piccin_72D'
    },
    {
      shortcut: '/firestop',
      title: 'Fire Stop Verto',
      content: 'Segue fotos e especificações do sistema de combate a incêndio Fire Stop Verto',
      defaultType: 'image',
      match: (it) => it.shortcut.includes('fire_stop') || (it.title && it.title.toLowerCase().includes('fire stop')),
      cleanPrefix: 'Fire_Stop_Verto'
    },
    {
      shortcut: '/versatilmax',
      title: 'Versátil MAX',
      content: 'Segue apresentação e detalhes técnicos do modelo Versátil MAX',
      defaultType: 'video',
      match: (it) => it.shortcut.includes('versatil_max') || (it.title && it.title.toLowerCase().includes('versátil max')),
      cleanPrefix: 'Versatil_MAX'
    },
    {
      shortcut: '/versatilstandard',
      title: 'Versátil Standard',
      content: 'Segue apresentação e detalhes técnicos do modelo Versátil Standard',
      defaultType: 'image',
      match: (it) => it.shortcut.includes('versatil_standard') || it.shortcut.includes('versatilstandard') || (it.title && it.title.toLowerCase().includes('versátil standard')),
      cleanPrefix: 'Versatil_Standard'
    },
    {
      shortcut: '/versatiltractor',
      title: 'Versátil Tractor',
      content: 'Segue linha Versátil instalada em tratores',
      defaultType: 'image',
      match: (it) => it.shortcut.includes('versatil_tractor') || (it.title && it.title.toLowerCase().includes('versátil tractor')),
      cleanPrefix: 'Versatil_Tractor'
    },
    {
      shortcut: '/demonstracao',
      title: 'Demonstração Verto em Campo',
      content: 'Confira a demonstração completa da tecnologia Verto em campo',
      defaultType: 'video',
      match: (it) => it.shortcut.includes('demonstra') || (it.title && it.title.toLowerCase().includes('demonstra')),
      cleanPrefix: 'Demonstracao_Verto'
    },
    {
      shortcut: '/reels',
      title: 'Vídeos & Reels de Campo',
      content: 'Confira os vídeos demonstrativos e depoimentos de campo Verto',
      defaultType: 'video',
      match: (it) => it.shortcut.includes('reels') || it.shortcut.includes('video_para_trafego') || (it.title && it.title.toLowerCase().includes('reels')),
      cleanPrefix: 'Reels_Verto_Campo'
    },
    {
      shortcut: '/seedpro',
      title: 'SeedPro Verto',
      content: 'Confira a tecnologia de distribuição precisa Verto SeedPro em operação',
      defaultType: 'video',
      match: (it) => it.shortcut.includes('seedpro') || (it.title && it.title.toLowerCase().includes('seedpro')),
      cleanFileName: 'Verto_SeedPro_Demonstracao.mp4'
    },
    {
      shortcut: '/cadastro',
      title: 'Ficha Cadastral Verto',
      content: 'Segue ficha cadastral oficial da Verto Soluções Agrícolas',
      defaultType: 'document',
      match: (it) => it.shortcut.includes('cadastro') || (it.title && it.title.toLowerCase().includes('cadastro')),
      cleanFileName: 'Ficha_Cadastral_Verto.pdf'
    },
    {
      shortcut: '/adesivo',
      title: 'Adesivo Verto & Versátil',
      content: 'Segue arquivo oficial dos adesivos das linhas Verto e Versátil',
      defaultType: 'document',
      match: (it) => it.shortcut.includes('adesivo') || (it.title && it.title.toLowerCase().includes('adesivo')),
      cleanFileName: 'Adesivo_Oficial_Verto.pdf'
    },
  ];

  let matchedCount = 0;
  for (const cfg of productConfigs) {
    const matched = items.filter(it => cfg.match(it));
    matchedCount += matched.length;
    console.log(`- ${cfg.shortcut} ("${cfg.title}"): ${matched.length} arquivos associados.`);
  }

  console.log(`\nTotal matched: ${matchedCount} / ${items.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

