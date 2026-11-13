const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  const clientsPath = path.resolve(__dirname, '../../scratch/backups_omie_20261103/clientes_omie.json');
  const nfsPath = path.resolve(__dirname, '../../scratch/backups_omie_20261103/nfs_omie.json');

  const clients = JSON.parse(fs.readFileSync(clientsPath, 'utf8'));
  const nfs = JSON.parse(fs.readFileSync(nfsPath, 'utf8'));

  const faturadosCod = new Set();
  nfs.forEach(nf => {
    if (nf.ide && nf.ide.dCan) return;
    if (nf.nfDestInt && nf.nfDestInt.nCodCli) faturadosCod.add(nf.nfDestInt.nCodCli);
  });

  const revendaKeywords = ['revenda', 'comercio', 'agropecuaria', 'tratores', 'maquinas', 'implementos', 'concessionaria', 'distribuidora', 'auto pecas'];

  const contacts = await prisma.contact.findMany({
    select: { id: true, cpfCnpj: true, phone: true, name: true, tags: true, isFaturado: true, totalFaturado: true }
  });

  const cpfMap = new Map();
  const phoneMap = new Map();

  contacts.forEach(c => {
    const cpf = (c.cpfCnpj || '').replace(/\D/g, '');
    if (cpf) cpfMap.set(cpf, c);
    const p = (c.phone || '').replace(/\D/g, '');
    if (p && p.length >= 8) phoneMap.set(p.slice(-8), c);
  });

  let taggedFornecedores = 0;
  let taggedRevendas = 0;
  let taggedClientes = 0;

  for (const oc of clients) {
    const rawCpf = (oc.cnpj_cpf || '').replace(/\D/g, '');
    const p1 = ((oc.telefone1_ddd || '') + (oc.telefone1_numero || '')).replace(/\D/g, '');
    const p2 = ((oc.telefone2_ddd || '') + (oc.telefone2_numero || '')).replace(/\D/g, '');

    let match = (rawCpf && cpfMap.has(rawCpf)) ? cpfMap.get(rawCpf) : null;
    if (!match && p1 && p1.length >= 8 && phoneMap.has(p1.slice(-8))) {
      match = phoneMap.get(p1.slice(-8));
    }
    if (!match && p2 && p2.length >= 8 && phoneMap.has(p2.slice(-8))) {
      match = phoneMap.get(p2.slice(-8));
    }

    if (!match) continue;

    const omieTags = (oc.tags || []).map(t => (t.tag || '').toLowerCase());
    const nameLower = `${oc.nome_fantasia || ''} ${oc.razao_social || ''}`.toLowerCase();
    const hasSales = faturadosCod.has(oc.codigo_cliente_omie) || match.isFaturado;

    const currentTags = Array.isArray(match.tags) ? [...match.tags] : [];
    let updated = false;

    const isRevenda = revendaKeywords.some(kw => nameLower.includes(kw));
    const isFornecedor = omieTags.includes('fornecedor');

    if (isRevenda) {
      if (!currentTags.includes('Revenda')) {
        currentTags.push('Revenda');
        updated = true;
        taggedRevendas++;
      }
    } else if (isFornecedor) {
      if (!currentTags.includes('Fornecedor')) {
        currentTags.push('Fornecedor');
        updated = true;
        taggedFornecedores++;
      }
    }

    if (hasSales && !currentTags.includes('CLIENTE')) {
      currentTags.push('CLIENTE');
      updated = true;
      taggedClientes++;
    }

    if (updated) {
      await prisma.contact.update({
        where: { id: match.id },
        data: { tags: currentTags }
      });
    }
  }

  console.log(`Enrichment complete!`);
  console.log(`Tagged Fornecedores: ${taggedFornecedores}`);
  console.log(`Tagged Revendas: ${taggedRevendas}`);
  console.log(`Tagged Clientes: ${taggedClientes}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

