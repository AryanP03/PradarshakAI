import { readonlyPool } from '../db/pool';
import { scoreSchemes, fetchActiveSchemes, recommendSchemes, ScoredScheme } from '../services/SchemeEngine';

async function main() {
  const schemes = await fetchActiveSchemes();
  console.log('Total schemes in DB:', schemes.length);

  // 1. Check queries
  console.log('\n--- 1. Query: "any scholarships for my Class 10 daughter" ---');
  const q1Schemes = scoreSchemes(schemes, { purpose: 'any scholarships for my Class 10 daughter', gender: 'female' });
  console.log(q1Schemes.slice(0, 5).map((s: ScoredScheme) => `${s.name} (id=${s.id}, score=${s.score}, tier=${s.tier}, pScore=${s.matchReasons.join(';')})`));

  console.log('\n--- 2. Query: "62 year old pension eligibility" ---');
  const q2Schemes = scoreSchemes(schemes, { purpose: 'pension eligibility', age: 62 });
  console.log(q2Schemes.slice(0, 5).map((s: ScoredScheme) => `${s.name} (id=${s.id}, score=${s.score}, tier=${s.tier}, reasons=${s.matchReasons.join(';')})`));

  console.log('\n--- 2c. Query: "I am 62 years old living in UP, can I get a pension?" ---');
  const q2cSchemes = scoreSchemes(schemes, { purpose: 'I am 62 years old living in UP, can I get a pension?', age: 62, state: 'Uttar Pradesh' });
  console.log(q2cSchemes.slice(0, 5).map((s: ScoredScheme) => `${s.name} (id=${s.id}, score=${s.score}, tier=${s.tier}, reasons=${s.matchReasons.join(';')})`));

  console.log('\n--- 2d. Query: "pension schemes in UP" with age: 62, state: "UP" ---');
  const q2dSchemes = scoreSchemes(schemes, { purpose: 'pension schemes', age: 62, state: 'Uttar Pradesh' });
  console.log(q2dSchemes.slice(0, 5).map((s: ScoredScheme) => `${s.name} (id=${s.id}, score=${s.score}, tier=${s.tier}, reasons=${s.matchReasons.join(';')})`));

  const { rows: upRows } = await readonlyPool.query("SELECT id, name, category, state, age_min, age_max, eligible_project_types FROM schemes WHERE name ILIKE '%Skill Development%' AND (state = 'Uttar Pradesh' OR name ILIKE '%UP%')");
  console.log('UP Skill scheme details:', upRows);

  console.log('\n--- 3. Query: "SC health insurance schemes" ---');
  const q3Schemes = scoreSchemes(schemes, { purpose: 'SC health insurance schemes' });
  console.log(q3Schemes.slice(0, 5).map((s: ScoredScheme) => `${s.name} (id=${s.id}, score=${s.score}, tier=${s.tier}, reasons=${s.matchReasons.join(';')})`));

  const { rows: testRows } = await readonlyPool.query('SELECT id, name, category, eligible_project_types, description FROM schemes WHERE id IN (52, 53, 42, 55, 56, 60, 144)');
  for (const r of testRows) {
    console.log(r.id, r.name, 'cat:', r.category, 'types:', r.eligible_project_types);
  }

  console.log('\n================ RECOMMEND SCHEMES RESULTS ================');

  const rec1 = await recommendSchemes({ purpose: 'any scholarships for my Class 10 daughter', gender: 'female' });
  console.log(`Rec 1 ("scholarships for Class 10 daughter"): Count = ${rec1.length}`);
  console.log(rec1.map(s => `  -> ${s.name} (id=${s.id}, score=${s.score}, tier=${s.tier})`));

  const rec2 = await recommendSchemes({ purpose: 'pension eligibility', age: 62 });
  console.log(`Rec 2 ("62 year old pension"): Count = ${rec2.length}`);
  console.log(rec2.map(s => `  -> ${s.name} (id=${s.id}, score=${s.score}, tier=${s.tier})`));

  const rec3 = await recommendSchemes({ purpose: 'SC health insurance schemes' });
  console.log(`Rec 3 ("SC health insurance schemes"): Count = ${rec3.length}`);
  console.log(rec3.map(s => `  -> ${s.name} (id=${s.id}, score=${s.score}, tier=${s.tier})`));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
