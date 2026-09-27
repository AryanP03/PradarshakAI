import { pool } from '../db/pool';

async function listEducationSchemes() {
  const res = await pool.query(`
    SELECT id, name, category, description, eligible_project_types, state, level
    FROM schemes
    WHERE category = 'education_loan' OR 'education' = ANY(eligible_project_types)
    ORDER BY id ASC;
  `);

  console.log(`Found ${res.rows.length} schemes with education category or tag:\n`);
  res.rows.forEach(r => {
    console.log(`ID ${r.id}: ${r.name}`);
    console.log(`  State: ${r.state} | Level: ${r.level}`);
    console.log(`  Types: ${JSON.stringify(r.eligible_project_types)}`);
    console.log(`  Desc: ${r.description}\n`);
  });

  await pool.end();
}

listEducationSchemes().catch(console.error);
