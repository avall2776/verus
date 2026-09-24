const { Client } = require('pg');

async function checkDirect() {
  const directUrl = 'postgresql://postgres:xRR%40QZJ5g3UV%3F74@db.aoxajwlocxetfxthkdxa.supabase.co:5432/postgres';
  const client = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log('Connected to Direct Supabase!');
    const res = await client.query('SHOW max_connections;');
    console.log('Direct max_connections:', res.rows[0]);

    const activeRes = await client.query('SELECT count(*) FROM pg_stat_activity;');
    console.log('Active connections in DB:', activeRes.rows[0]);

    const t0 = Date.now();
    await client.query('SELECT 1');
    console.log('Direct query latency:', Date.now() - t0, 'ms');
  } catch (err) {
    console.error('Direct connection error:', err.message);
  } finally {
    await client.end();
  }
}

checkDirect();
