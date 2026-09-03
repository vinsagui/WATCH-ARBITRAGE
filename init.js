require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function init() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('✅ Base de données initialisée.');
  await pool.end();
}

init().catch((err) => {
  console.error('❌ Erreur init DB:', err);
  process.exit(1);
});
