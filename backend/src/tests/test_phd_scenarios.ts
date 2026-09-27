import { fetchActiveSchemes, scoreSchemes, recommendSchemes } from '../services/SchemeEngine';

async function testScenarios() {
  console.log('=== TEST SCENARIO A: recommendSchemes({ purpose: "I want to pursue a PhD" }, undefined) ===');
  const resA = await recommendSchemes({ purpose: "I want to pursue a PhD" }, undefined, 5);
  resA.forEach((s, i) => console.log(`${i+1}. [ID ${s.id}] ${s.name} (Score: ${s.score}, Tier: ${s.tier})`));

  console.log('\n=== TEST SCENARIO B: recommendSchemes({ purpose: "I want to pursue a PhD" }, "education_loan") ===');
  const resB = await recommendSchemes({ purpose: "I want to pursue a PhD" }, "education_loan", 5);
  resB.forEach((s, i) => console.log(`${i+1}. [ID ${s.id}] ${s.name} (Score: ${s.score}, Tier: ${s.tier})`));

  console.log('\n=== TEST SCENARIO C: recommendSchemes({ purpose: "I want to pursue a PhD", loan_amount_rs: 500000 }, "education_loan") ===');
  const resC = await recommendSchemes({ purpose: "I want to pursue a PhD", loan_amount_rs: 500000 }, "education_loan", 5);
  resC.forEach((s, i) => console.log(`${i+1}. [ID ${s.id}] ${s.name} (Score: ${s.score}, Tier: ${s.tier})`));

  console.log('\n=== CHECK ELS (ID 10) vs FELLOWSHIPS (22, 32) IN DB ===');
  const all = await fetchActiveSchemes();
  [10, 22, 32].forEach(id => {
    const s = all.find(x => x.id === id);
    if (s) {
      console.log(`ID ${s.id}: ${s.name}`);
      console.log(`  category: ${s.category}`);
      console.log(`  max_loan_lakh: ${s.max_loan_lakh}`);
      console.log(`  interest_rate: ${s.interest_rate_min} - ${s.interest_rate_max}`);
      console.log(`  education_level: ${s.education_level}`);
      console.log(`  education_levels: ${JSON.stringify(s.education_levels)}`);
      console.log(`  types: ${JSON.stringify(s.eligible_project_types)}`);
    }
  });

  process.exit(0);
}

testScenarios().catch(e => { console.error(e); process.exit(1); });
