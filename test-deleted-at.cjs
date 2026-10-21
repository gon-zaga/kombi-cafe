const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
  const result = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name IN ('menu_items', 'add_ons') AND column_name = 'deleted_at'");
  console.log('deleted_at columns:', result.rows);
  await pool.end();
}

test().catch(console.error);