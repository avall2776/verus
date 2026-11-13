const fs = require('fs');
const env = fs.readFileSync('/root/verus/backend/.env', 'utf8');
const lines = env.split('\n').filter(l => l.includes('EVOLUTION') || l.includes('WHATSAPP'));
console.log(lines.join('\n'));

