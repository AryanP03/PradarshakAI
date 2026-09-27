import { pool, readonlyPool } from '../db/pool';
import { fetchActiveSchemes, scoreSchemes } from '../services/SchemeEngine';

async function testPhD() {
  const all = await fetchActiveSchemes();
  const profile = { purpose: 'I want to pursue a PhD' };

  console.log('Query: "I want to pursue a PhD"');
  const scored = scoreSchemes(all, profile);

  const targetIds = [10, 22, 32];
  const targetSchemes = scored.filter(s => targetIds.includes(s.id));

  console.log('\n--- TARGET SCHEMES SCORE BREAKDOWN ---');
  for (const s of targetSchemes) {
    console.log(`\nID: ${s.id} | Name: "${s.name}"`);
    console.log(`Score: ${s.score} | Match %: ${s.match_percentage} | Tier: ${s.tier}`);
    console.log(`education_level: ${s.education_level}`);
    console.log(`education_levels: ${JSON.stringify(s.education_levels)}`);
    console.log(`eligible_project_types: ${JSON.stringify(s.eligible_project_types)}`);
    console.log(`category: ${s.category}`);
    console.log(`interest_rate_min: ${s.interest_rate_min}, max: ${s.interest_rate_max}`);
    console.log(`max_loan_lakh: ${s.max_loan_lakh}`);
    console.log(`matchReasons: ${JSON.stringify(s.matchReasons)}`);
    console.log(`warnings: ${JSON.stringify(s.warnings)}`);
  }

  console.log('\n--- TOP 5 RANKED SCHEMES FOR THIS QUERY ---');
  scored.slice(0, 5).forEach((s, idx) => {
    console.log(`${idx + 1}. [ID ${s.id}] ${s.name} (Score: ${s.score}, Tier: ${s.tier}, Level: ${s.education_level})`);
  });

  process.exit(0);
}

testPhD().catch(e => { console.error(e); process.exit(1); });
