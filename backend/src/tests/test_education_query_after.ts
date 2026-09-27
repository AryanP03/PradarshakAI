import { fetchActiveSchemes, scoreSchemes } from '../services/SchemeEngine';

async function testAfter() {
  console.log('=== TEST QUERY AFTER CHANGES ===');
  console.log('Query: "suggest schemes for higher education abroad", Income: ₹2,00,000\n');

  const allSchemes = await fetchActiveSchemes();
  const profile = {
    purpose: 'suggest schemes for higher education abroad',
    family_income_rs: 200000,
  };

  const scored = scoreSchemes(allSchemes, profile);
  
  // Filter for education category schemes
  const eduScored = scored.filter(s => s.category === 'education_loan' || (s.eligible_project_types || []).includes('education') || (s.education_level && s.education_level !== 'not_applicable'));

  console.log(`Total education schemes evaluated: ${eduScored.length}`);
  console.log('\nTop 15 Schemes for this query AFTER changes:');
  scored.slice(0, 15).forEach((s, idx) => {
    console.log(`${idx + 1}. [ID ${s.id}] ${s.name} (Tier: ${s.tier}, Score: ${s.score}, State: ${s.state}, Level: ${s.education_level})`);
  });

  console.log('\n--- ALL Education Schemes Ranked (AFTER): ---');
  eduScored.forEach((s, idx) => {
    console.log(`${idx + 1}. [ID ${s.id}] ${s.name} (Score: ${s.score}, Tier: ${s.tier}, Level: ${s.education_level}, State: ${s.state})`);
  });
}

testAfter().catch(console.error);
