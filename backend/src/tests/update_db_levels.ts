import { pool } from '../db/pool';

async function updateDB() {
  console.log('--- Updating ELS (ID 10) in schemes ---');
  await pool.query(`
    UPDATE schemes 
    SET education_level = 'undergraduate',
        education_levels = ARRAY['undergraduate', 'postgraduate', 'professional_course']
    WHERE id = 10
  `);

  console.log('--- Ensuring Fellowships (ID 22, 32) are doctoral ---');
  await pool.query(`
    UPDATE schemes 
    SET education_level = 'doctoral',
        education_levels = ARRAY['doctoral']
    WHERE id IN (22, 32)
  `);

  const res = await pool.query('SELECT id, name, category, education_level, education_levels, eligible_project_types FROM schemes WHERE id IN (10, 22, 23, 32, 50, 51)');
  console.log('Updated rows:');
  res.rows.forEach(r => {
    console.log(`ID ${r.id}: "${r.name}" | level: ${r.education_level} | levels: ${JSON.stringify(r.education_levels)} | types: ${JSON.stringify(r.eligible_project_types)}`);
  });

  process.exit(0);
}

updateDB().catch(e => { console.error(e); process.exit(1); });
