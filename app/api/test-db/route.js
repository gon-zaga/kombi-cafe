import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
// To check if connected to neon or not
export async function GET() {
  try {
    const result = await pool.query('SELECT NOW()');
    return Response.json({ success: true, time: result.rows[0] });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}