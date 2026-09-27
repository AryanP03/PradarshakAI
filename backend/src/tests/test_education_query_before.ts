import { fetchActiveSchemes, scoreSchemes } from '../services/SchemeEngine';

async function testBefore() {
  console.log('=== TEST QUERY BEFORE CHANGES ===');
  console.log('Query: "suggest schemes for higher education abroad", Income: ₹2,00,000\n');

  const allSchemes = await fetchActiveSchemes();
  const profile = {
    purpose: 'suggest schemes for higher education abroad',
    family_income_rs: 200000,
  };

  const scored = scoreSchemes(allSchemes, profile);
  
  // Filter for education category schemes
  const eduScored = scored.filter(s => s.category === 'education_loan' || (s.eligible_project_types || []).includes('education'));

  console.log(`Total education schemes evaluated: ${eduScored.length}`);
  console.log('\nTop 15 Schemes for this query BEFORE changes:');
  scored.slice(0, 15).forEach((s, idx) => {
    console.log(`${idx + 1}. [ID ${s.id}] ${s.name} (Tier: ${s.tier}, Score: ${s.score}, State: ${s.state})`);
    console.log(`   Types: ${JSON.stringify(s.eligible_project_types)}`);
  });

  console.log('\n--- ALL Education Schemes Ranked (BEFORE): ---');
  eduScored.forEach((s, idx) => {
    console.log(`${idx + 1}. [ID ${s.id}] ${s.name} (Score: ${s.score}, Tier: ${s.tier}, State: ${s.state})`);
  });
}

testBefore().catch(console.error);
