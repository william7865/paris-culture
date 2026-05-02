const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDb = async () => {
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations', '001_init.sql'),
    'utf8'
  );
  await pool.query(sql);
  console.log('[db] Tables initialisées');
};

module.exports = { pool, initDb };
