import { pool, readonlyPool } from '../db/pool';

async function checkSanity() {
  console.log('=== CHECK 1: TABLE SANITY ===');
  const schemesCount = await pool.query('SELECT count(*) FROM schemes');
  const updatedCount = await pool.query('SELECT count(*) FROM updated_schemes');
  console.log(`COUNT in schemes: ${schemesCount.rows[0].count}`);
  console.log(`COUNT in updated_schemes: ${updatedCount.rows[0].count}`);

  const dupIdSchemes = await pool.query('SELECT id, count(*) FROM schemes GROUP BY id HAVING count(*) > 1');
  const dupNameSchemes = await pool.query('SELECT name, count(*) FROM schemes GROUP BY name HAVING count(*) > 1');
  console.log('Duplicate IDs in schemes:', dupIdSchemes.rows);
  console.log('Duplicate Names in schemes:', dupNameSchemes.rows);

  const dupIdUpdated = await pool.query('SELECT id, count(*) FROM updated_schemes GROUP BY id HAVING count(*) > 1');
  const dupNameUpdated = await pool.query('SELECT name, count(*) FROM updated_schemes GROUP BY name HAVING count(*) > 1');
  console.log('Duplicate IDs in updated_schemes:', dupIdUpdated.rows);
  console.log('Duplicate Names in updated_schemes:', dupNameUpdated.rows);

  console.log('\n=== SPOT CHECK 5 ROWS FOR ARRAYS & BOOLEANS ===');
  const randomRows = await readonlyPool.query(`
    SELECT id, name, eligible_project_types, aliases, documents_required,
           active, education_required, for_sc, for_st, state, level
    FROM schemes
    ORDER BY id
    LIMIT 5
  `);
  
  for (const r of randomRows.rows) {
    console.log(`ID ${r.id}: ${r.name}`);
    console.log('  eligible_project_types:', Array.isArray(r.eligible_project_types), typeof r.eligible_project_types, r.eligible_project_types);
    console.log('  aliases:', Array.isArray(r.aliases), typeof r.aliases, r.aliases);
    console.log('  documents_required:', Array.isArray(r.documents_required), typeof r.documents_required, r.documents_required?.slice(0, 2));
    console.log('  active:', typeof r.active, r.active);
    console.log('  education_required:', typeof r.education_required, r.education_required);
    console.log('  for_sc:', typeof r.for_sc, r.for_sc);
    console.log('  for_st:', typeof r.for_st, r.for_st);
  }

  console.log('\n=== RAW RESULT OBJECT (ID 1) ===');
  const row1 = await readonlyPool.query('SELECT * FROM schemes WHERE id = 1');
  console.log(JSON.stringify(row1.rows[0], null, 2));

  console.log('\n=== CHECK FOR "?" OR MANGLED CHARACTERS ===');
  const qMarkCheck = await readonlyPool.query(`
    SELECT id, name, description, notes
    FROM schemes
    WHERE description LIKE '%?%' OR notes LIKE '%?%' OR name LIKE '%?%'
  `);
  console.log(`Schemes with '?' in name/description/notes: ${qMarkCheck.rows.length}`);
  if (qMarkCheck.rows.length > 0) {
    console.log('Matches:', qMarkCheck.rows.map(r => ({ id: r.id, name: r.name })));
  }

  const rupeeCheck = await readonlyPool.query(`
    SELECT id, name, description
    FROM schemes
    WHERE description LIKE '%₹%'
    LIMIT 3
  `);
  console.log('\n3 Descriptions with ₹:');
  for (const r of rupeeCheck.rows) {
    console.log(`[ID ${r.id}] ${r.name}:`);
    console.log(`   ${r.description.slice(0, 180)}...`);
  }

  process.exit(0);
}

checkSanity().catch(err => {
  console.error(err);
  process.exit(1);
});
