const { Client } = require('ssh2');

const testCode = `
const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const lines = env.split('\\n');
  let secret = 'super-secret-key-change-me';
  for (const line of lines) {
    if (line.startsWith('JWT_SECRET=')) {
      secret = line.split('=')[1].trim().replace(/['"]/g, '');
    }
  }

  const user = await prisma.user.findFirst({
    where: { tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126', email: 'comercial@vertoagricola.com' }
  });

  const token = jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126'
  }, secret, { expiresIn: '1h' });

  for (const p of ['day', 'week', 'month', 'all']) {
    const res = await axios.get('http://localhost:3001/goals/leaderboard', {
      headers: {
        Authorization: 'Bearer ' + token,
        'x-tenant-id': 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126'
      },
      params: { period: p }
    });
    console.log('=== PERIOD: ' + p + ' (count: ' + res.data.length + ') ===');
    console.log(res.data.map(u => ({
      rank: u.rank,
      name: u.name,
      email: u.email,
      deals: u.dealsWon,
      revenue: u.totalRevenueWon,
      departments: u.departments
    })));
  }

  await prisma.$disconnect();
}

run().catch(e => {
  console.error(e.response ? e.response.data : e.message);
  prisma.$disconnect();
});
`;

const conn = new Client();

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/root/verus/backend/test_leaderboard_live.js');
    stream.end(testCode, () => {
      console.log('Test file written to VPS. Executing...');
      conn.exec('cd /root/verus/backend && node test_leaderboard_live.js', (err, execStream) => {
        if (err) throw err;
        execStream.on('close', (code) => {
          console.log('Execution finished with code ' + code);
          conn.end();
        }).on('data', (d) => process.stdout.write(d))
          .stderr.on('data', (d) => process.stderr.write(d));
      });
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
