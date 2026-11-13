const axios = require('axios');
const leroHeaders = {
  'Authorization': 'Bearer 1877|P3WJ4WJ6vAebn8gB0y4N7h2U6h9MvE8Z', // let's check lero token
};

// Let's search Lero token or check lero contacts
const fs = require('fs');
const syncScript = fs.readFileSync('/root/verus/backend/scripts/sync_lero_fast.js', 'utf8');
const tokenMatch = syncScript.match(/Bearer ([^'"]+)/);
console.log('Lero token:', tokenMatch ? tokenMatch[1] : 'not found');

