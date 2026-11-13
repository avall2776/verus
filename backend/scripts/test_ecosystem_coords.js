const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const coordsMap = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/shared/data/brazil_cities_coords.json'), 'utf8'));

function normalizeCity(name) {
  if (!name) return '';
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getCoords(city, state) {
  if (!city) return null;
  const cleanCity = city.replace(/\s*\(.*?\)\s*/g, '').trim();
  const norm = normalizeCity(cleanCity);
  const uf = (state || '').toLowerCase().trim();
  const withUf = norm + '_' + uf;
  if (coordsMap[withUf]) return { lat: coordsMap[withUf][0], lng: coordsMap[withUf][1] };
  if (coordsMap[norm]) return { lat: coordsMap[norm][0], lng: coordsMap[norm][1] };
  return null;
}

async function main() {
  const contacts = await prisma.contact.findMany({
    select: { id: true, name: true, city: true, state: true, cep: true, tags: true, isFaturado: true, totalFaturado: true, phone: true }
  });

  let resellers = [];
  let suppliers = [];
  let clients = [];

  contacts.forEach(c => {
    const coords = getCoords(c.city, c.state);
    if (!coords) return;

    const tags = (c.tags || []).map(t => (t || '').toLowerCase());
    const isRevenda = tags.some(t => t.includes('revenda') || t.includes('parceiro') || t.includes('concessionaria'));
    const isFornecedor = tags.some(t => t.includes('fornecedor'));
    const isClient = c.isFaturado || tags.some(t => t.includes('cliente'));

    const item = {
      id: c.id,
      name: c.name,
      city: c.city,
      state: c.state,
      cep: c.cep,
      lat: coords.lat,
      lng: coords.lng,
      phone: c.phone
    };

    if (isRevenda) {
      resellers.push(item);
    } else if (isFornecedor) {
      suppliers.push(item);
    } else if (isClient) {
      clients.push({ ...item, totalFaturado: c.totalFaturado });
    }
  });

  console.log(`Mapped Ecosystem pins with exact coordinates:`);
  console.log(`- Resellers (Roxo): ${resellers.length}`);
  console.log(`- Suppliers (Laranja): ${suppliers.length}`);
  console.log(`- Clients (Ciano): ${clients.length}`);
  console.log(`Sample Reseller:`, resellers[0]);
  console.log(`Sample Supplier:`, suppliers[0]);
  console.log(`Sample Client:`, clients[0]);

  await prisma.$disconnect();
}

main().catch(console.error);

