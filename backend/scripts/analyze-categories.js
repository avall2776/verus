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
      mediaDriveId: true,
    },
    orderBy: { shortcut: 'asc' },
  });

  const groups = {};
  for (const it of items) {
    let key = 'outros';
    const sc = it.shortcut.toLowerCase();
    const t = (it.title || '').toLowerCase();
    const fn = (it.fileName || '').toLowerCase();

    if (sc.includes('apresentacao') || t.includes('apresentação')) {
      key = 'apresentacao';
    } else if (sc.includes('caixa_suspensa') || t.includes('caixa suspensa') || sc.includes('caixasuspensa')) {
      key = 'caixasuspensa';
    } else if (sc.includes('caixa_no_cafe') || t.includes('caixa no café')) {
      key = 'caixasuspensa_cafe';
    } else if (sc.includes('case') && (sc.includes('eazy') || t.includes('eazy'))) {
      key = 'caseeazyriser';
    } else if (sc.includes('case') && (sc.includes('fast') || t.includes('fast'))) {
      key = 'casefastriser';
    } else if (sc.includes('escarificador') || t.includes('escarificador')) {
      key = 'escarificadorgts';
    } else if (sc.includes('2_staras_44_e_40') || t.includes('staras 44 e 40')) {
      key = 'staras44e40';
    } else if (sc.includes('stara') && (sc.includes('absoluta') || t.includes('absoluta'))) {
      key = 'staraabsoluta';
    } else if (sc.includes('stara') && (sc.includes('princesa') || sc.includes('cinderela') || t.includes('princesa'))) {
      key = 'staraprincesa';
    } else if (sc.includes('db_43') || t.includes('db 43')) {
      key = 'johndeeredb43';
    } else if (sc.includes('1113') || t.includes('1113')) {
      key = 'johndeere1113';
    } else if (sc.includes('momentum') && (sc.includes('30') || t.includes('30'))) {
      key = 'momentum30';
    } else if (sc.includes('momentum') && (sc.includes('40') || t.includes('40'))) {
      key = 'momentum40';
    } else if (sc.includes('momentum')) {
      key = 'momentum';
    } else if (sc.includes('pl_6000') || sc.includes('pl6000') || t.includes('pl 6000')) {
      key = 'newhollandpl6000';
    } else if (sc.includes('planticenter') || t.includes('planticenter')) {
      key = 'planticenterfragata';
    } else if (sc.includes('civemasa') || t.includes('civemasa')) {
      key = 'civemasa';
    } else if (sc.includes('ecoagricola') || t.includes('ecoagricola')) {
      key = 'gradeecoagricola';
    } else if (sc.includes('piccin') || t.includes('piccin')) {
      key = 'gradepiccin';
    } else if (sc.includes('fire_stop') || t.includes('fire stop')) {
      key = 'firestop';
    } else if (sc.includes('versatil_max') || t.includes('versátil max')) {
      key = 'versatilmax';
    } else if (sc.includes('versatil_standard') || t.includes('versátil standard')) {
      key = 'versatilstandard';
    } else if (sc.includes('versatil_tractor') || t.includes('versátil tractor')) {
      key = 'versatiltractor';
    } else if (sc.includes('gergelim') || t.includes('gergelim')) {
      key = 'gergelim';
    } else if (sc.includes('seedpro') || t.includes('seedpro')) {
      key = 'seedpro';
    } else if (sc.includes('demonstra') || t.includes('demonstra')) {
      key = 'demonstracao';
    } else if (sc.includes('reels') || t.includes('reels') || sc.includes('video_para_trafego')) {
      key = 'reels';
    } else if (sc.includes('adesivo') || t.includes('adesivo')) {
      key = 'adesivo';
    } else if (sc.includes('cadastro') || t.includes('cadastro')) {
      key = 'cadastro';
    } else if (sc.includes('vagas') || t.includes('vagas')) {
      key = 'vagas';
    } else if (sc.includes('entrega') || t.includes('entrega')) {
      key = 'entregas';
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(it);
  }

  console.log('--- CLASSIFIED PRODUCT SHORTCUT GROUPS ---');
  for (const [k, v] of Object.entries(groups)) {
    const types = v.map(x => x.type);
    console.log(`Shortcut: /${k} (${v.length} files) -> imgs: ${types.filter(t=>t==='image').length}, vids: ${types.filter(t=>t==='video').length}, docs: ${types.filter(t=>t==='document').length}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

