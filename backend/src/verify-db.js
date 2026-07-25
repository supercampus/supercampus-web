import 'dotenv/config';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const tables = await pool.query("select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1::text[]) order by table_name", [['tenants', 'students', 'student_app_state', 'activity_events', 'schema_migrations']]);
  const students = await pool.query('select t.code as tenant, s.roll_number as roll, s.name, s.is_active as active, length(s.password_hash) > 20 as password_configured from students s join tenants t on t.id = s.tenant_id where s.id = any($1::uuid[]) order by t.code', [['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222']]);
  const states = await pool.query('select count(*)::int as count from student_app_state where student_id = any($1::uuid[])', [['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222']]);
  console.log(JSON.stringify({ tables: tables.rows.map((row) => row.table_name), students: students.rows, stateRows: states.rows[0].count }, null, 2));
} finally { await pool.end(); }