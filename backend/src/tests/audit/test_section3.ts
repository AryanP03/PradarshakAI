import { pool } from '../db/pool';
import { scoreSchemes, fetchActiveSchemes } from '../services/SchemeEngine';

async function testSection3() {
  console.log('=== SECTION 3: SCORING & MATCHING REGRESSION TEST ===');

  // Let's find some non-original-14 schemes
  const newSchemesRes = await pool.query('SELECT id, name, category, eligible_project_types, state, level FROM schemes WHERE id > 14 LIMIT 15');
  console.log('Sample non-original-14 schemes:');
  newSchemesRes.rows.forEach(r => {
    console.log(`ID ${r.id}: ${r.name} (${r.category}, state: ${r.state}) types: ${JSON.stringify(r.eligible_project_types)}`);
  });

  // Test Profile: Dairy farming in Rajasthan
  // Let's query if Rajasthan has dairy or livestock schemes, or a central dairy scheme
  const allSchemes = await fetchActiveSchemes();
  
  // Test Case A: A farmer in Rajasthan looking for dairy farming / cattle rearing
  const profileDairy = {
    purpose: 'dairy farming cattle buffalo',
    state: 'Rajasthan',
    gender: 'male',
    family_income_rs: 200000,
    loan_amount_rs: 150000,
  };
  const scoredDairy = scoreSchemes(allSchemes, profileDairy);
  console.log('\n--- Dairy Farming in Rajasthan Results (Top 5) ---');
  scoredDairy.slice(0, 5).forEach((s, idx) => {
    console.log(`${idx + 1}. [ID ${s.id}] ${s.name} (Tier: ${s.tier}, Score: ${s.score}, State: ${s.state})`);
  });

  // Test Case B: A student looking for a PhD / Higher Education Fellowship
  const profilePhd = {
    purpose: 'National Overseas Scholarship for Higher Education',
    state: 'Central',
    gender: 'male',
    family_income_rs: 400000,
  };
  const scoredPhd = scoreSchemes(allSchemes, profilePhd);
  console.log('\n--- National Overseas Scholarship Results (Top 5) ---');
  scoredPhd.slice(0, 5).forEach((s, idx) => {
    console.log(`${idx + 1}. [ID ${s.id}] ${s.name} (Tier: ${s.tier}, Score: ${s.score}, State: ${s.state})`);
  });

  // Test Case C: An artisan / weaver looking for weaving assistance
  const profileWeaver = {
    purpose: 'handloom weaving textile artisan craft',
    state: 'Assam',
    gender: 'female',
    family_income_rs: 150000,
    loan_amount_rs: 100000,
  };
  const scoredWeaver = scoreSchemes(allSchemes, profileWeaver);
  console.log('\n--- Handloom Weaver in Assam Results (Top 5) ---');
  scoredWeaver.slice(0, 5).forEach((s, idx) => {
    console.log(`${idx + 1}. [ID ${s.id}] ${s.name} (Tier: ${s.tier}, Score: ${s.score}, State: ${s.state})`);
  });

  await pool.end();
}

testSection3().catch(err => {
  console.error(err);
  process.exit(1);
});
