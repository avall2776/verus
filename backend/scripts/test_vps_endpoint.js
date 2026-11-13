const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const http = require('http');

async function test() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'verto' } }
  });
  console.log('User found:', user?.email, 'tenantId:', user?.tenantId);
  const token = jwt.sign({ sub: user.id, email: user.email, tenantId: user.tenantId, role: user.role }, process.env.JWT_SECRET || 'super-secret-key-change-me', { expiresIn: '1h' });

  const req = http.request('http://187.127.10.166:3001/metrics/geo-map', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Authorization': 'Bearer ' + token,
      'x-tenant-id': user.tenantId
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status code with token:', res.statusCode);
      console.log('Body:', data);
      try {
        const json = JSON.parse(data);
        console.log('Has ecosystem?', !!json.ecosystem);
        if (json.ecosystem) {
          console.log('Ecosystem counts:', json.ecosystem.counts);
          console.log('Resellers len:', json.ecosystem.resellers?.length);
          console.log('Suppliers len:', json.ecosystem.suppliers?.length);
          console.log('Clients len:', json.ecosystem.clients?.length);
        } else {
          console.log('Keys returned:', Object.keys(json));
        }
      } catch (e) {
        console.log('Error parsing response:', data.slice(0, 300));
      }
    });
  });
  req.on('error', console.error);
  req.end();
  await prisma.$disconnect();
}
test().catch(console.error);
