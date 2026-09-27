import { pool, readonlyPool } from '../db/pool';
import { fetchActiveSchemes, scoreSchemes } from '../services/SchemeEngine';

async function diagnose() {
  console.log('--- 1. REAL SCHEMES IN DB BY ID & CATEGORY ---');
  const res = await pool.query('SELECT id, name, category, education_level, education_levels, eligible_project_types FROM schemes ORDER BY id ASC');
  console.log(`Total rows in schemes table: ${res.rows.length}`);
  
  const eduLoan = res.rows.filter(r => r.category === 'education_loan');
  console.log(`Rows with category = "education_loan": ${eduLoan.length}`);

  console.log('\n--- 2. REAL SCHEMES AT IDs 20 to 35 ---');
  res.rows.filter(r => r.id >= 20 && r.id <= 35).forEach(r => {
    console.log(`ID ${r.id}: "${r.name}" | category: ${r.category} | edu_level: ${r.education_level}`);
  });

  console.log('\n--- 3. REAL SCHEMES AT IDs 36 to 55 ---');
  res.rows.filter(r => r.id >= 36 && r.id <= 55).forEach(r => {
    console.log(`ID ${r.id}: "${r.name}" | category: ${r.category} | edu_level: ${r.education_level}`);
  });

  console.log('\n--- 4. HOUSING SCHEMES IN DB ---');
  const housingSchemes = res.rows.filter(r => 
    r.name.toLowerCase().includes('housing') || 
    r.name.toLowerCase().includes('pmay') || 
    r.name.toLowerCase().includes('awas') ||
    r.name.toLowerCase().includes('house') ||
    (r.eligible_project_types || []).some((t: string) => t.toLowerCase().includes('hous') || t.toLowerCase().includes('awas') || t.toLowerCase().includes('home'))
  );
  console.log(`Total housing-related schemes found: ${housingSchemes.length}`);
  housingSchemes.forEach(r => {
    console.log(`ID ${r.id}: "${r.name}" | category: ${r.category} | types: ${JSON.stringify(r.eligible_project_types)}`);
  });

  console.log('\n--- 5. CHECK PASSENGER AUTO RICKSHAW LOAN (GUJARAT) ---');
  const auto = res.rows.find(r => r.name.toLowerCase().includes('auto rickshaw'));
  if (auto) {
    console.log(`Auto rickshaw scheme: ID ${auto.id}: "${auto.name}" | category: ${auto.category} | types: ${JSON.stringify(auto.eligible_project_types)}`);
  }

  process.exit(0);
}

diagnose().catch(err => {
  console.error(err);
  process.exit(1);
});
