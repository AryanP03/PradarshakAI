import { pool, readonlyPool } from '../db/pool';
import { fetchActiveSchemes, scoreSchemes, recommendSchemes } from '../services/SchemeEngine';

async function testHousing() {
  const profile = {
    purpose: 'I want to buy a new house',
    family_income_rs: 100000,
  };

  console.log('Query:', JSON.stringify(profile));

  console.log('\n--- 1. Testing recommendSchemes(profile, undefined, 5) ---');
  const recs = await recommendSchemes(profile, undefined, 5);
  recs.forEach((s, i) => {
    console.log(`${i+1}. [ID ${s.id}] "${s.name}" (Score: ${s.score}, Tier: ${s.tier}, State: ${s.state})`);
    console.log(`   match_percentage: ${s.match_percentage}`);
    console.log(`   category: ${s.category}`);
    console.log(`   types: ${JSON.stringify(s.eligible_project_types)}`);
    console.log(`   matchReasons: ${JSON.stringify(s.matchReasons)}`);
    console.log(`   warnings: ${JSON.stringify(s.warnings)}`);
    console.log(`   disqualificationReason: ${s.disqualificationReason}`);
  });

  console.log('\n--- 2. Score breakdown for Passenger Auto Rickshaw (ID 75) ---');
  const all = await fetchActiveSchemes();
  const scoredAll = scoreSchemes(all, profile);
  const auto = scoredAll.find(s => s.id === 75 || s.name.toLowerCase().includes('auto rickshaw'));
  if (auto) {
    console.log(`[ID ${auto.id}] "${auto.name}"`);
    console.log(`Score: ${auto.score}, Tier: ${auto.tier}, match_percentage: ${auto.match_percentage}`);
    console.log(`types: ${JSON.stringify(auto.eligible_project_types)}`);
    console.log(`matchReasons: ${JSON.stringify(auto.matchReasons)}`);
    console.log(`warnings: ${JSON.stringify(auto.warnings)}`);
    console.log(`disqualification: ${auto.disqualificationReason}`);
  }

  console.log('\n--- 3. Score breakdown for Housing schemes (PMAY-G ID 50, PMAY-U ID 51, etc.) ---');
  const housingIds = [50, 51, 95, 136, 162];
  scoredAll.filter(s => housingIds.includes(s.id)).forEach(s => {
    console.log(`[ID ${s.id}] "${s.name}"`);
    console.log(`Score: ${s.score}, Tier: ${s.tier}, match_percentage: ${s.match_percentage}, State: ${s.state}`);
    console.log(`types: ${JSON.stringify(s.eligible_project_types)}`);
    console.log(`matchReasons: ${JSON.stringify(s.matchReasons)}`);
    console.log(`warnings: ${JSON.stringify(s.warnings)}`);
    console.log(`disqualification: ${s.disqualificationReason}`);
  });

  console.log('\n--- 4. Top 10 Scored Schemes Across Entire Database for Housing Query ---');
  scoredAll.slice(0, 10).forEach((s, i) => {
    console.log(`${i+1}. [ID ${s.id}] "${s.name}" (Score: ${s.score}, Tier: ${s.tier}, State: ${s.state}) types: ${JSON.stringify(s.eligible_project_types)}`);
  });

  process.exit(0);
}

testHousing().catch(e => { console.error(e); process.exit(1); });
