import { fetchActiveSchemes, scoreSchemes, recommendSchemes } from '../services/SchemeEngine';

async function testAll() {
  console.log('================================================================');
  console.log('TEST 1: "I want to pursue a PhD"');
  console.log('================================================================');
  const allSchemes = await fetchActiveSchemes();
  const profilePhD = { purpose: 'I want to pursue a PhD' };
  const phdScored = scoreSchemes(allSchemes, profilePhD);

  console.log('\n--- SCORES FOR ELS, NATIONAL FELLOWSHIP, RGNF ---');
  [22, 32, 10, 23].forEach(id => {
    const s = phdScored.find(x => x.id === id);
    if (s) {
      console.log(`[ID ${s.id}] "${s.name}"`);
      console.log(`  Score: ${s.score} | Match%: ${s.match_percentage} | Tier: ${s.tier}`);
      console.log(`  education_level: ${s.education_level} | levels: ${JSON.stringify(s.education_levels)}`);
      console.log(`  matchReasons: ${JSON.stringify(s.matchReasons)}`);
      console.log(`  warnings: ${JSON.stringify(s.warnings)}`);
    }
  });

  console.log('\n--- TOP 5 RECOMMENDATIONS FOR "I want to pursue a PhD" ---');
  const topPhD = await recommendSchemes(profilePhD, undefined, 5);
  topPhD.forEach((s, i) => {
    console.log(`${i+1}. [ID ${s.id}] "${s.name}" | Score: ${s.score} | Match%: ${s.match_percentage} | Tier: ${s.tier}`);
  });

  console.log('\n================================================================');
  console.log('TEST 2: "I want to buy a new house, my income is 1 lakh, I belong to SC category"');
  console.log('================================================================');
  const profileHousing = {
    purpose: 'I want to buy a new house, my income is 1 lakh, I belong to SC category',
    family_income_rs: 100000,
  };
  const housingScored = scoreSchemes(allSchemes, profileHousing);

  console.log('\n--- SCORES FOR HOUSING SCHEMES & AUTO RICKSHAW ---');
  [50, 51, 75].forEach(id => {
    const s = housingScored.find(x => x.id === id);
    if (s) {
      console.log(`[ID ${s.id}] "${s.name}"`);
      console.log(`  Score: ${s.score} | Match%: ${s.match_percentage} | Tier: ${s.tier} | State: ${s.state}`);
      console.log(`  types: ${JSON.stringify(s.eligible_project_types)}`);
      console.log(`  matchReasons: ${JSON.stringify(s.matchReasons)}`);
      console.log(`  warnings: ${JSON.stringify(s.warnings)}`);
      console.log(`  disqualification: ${s.disqualificationReason}`);
    }
  });

  console.log('\n--- TOP 3 RECOMMENDATIONS FOR HOUSING QUERY ---');
  const topHousing = await recommendSchemes(profileHousing, undefined, 3);
  topHousing.forEach((s, i) => {
    console.log(`${i+1}. [ID ${s.id}] "${s.name}" | Score: ${s.score} | Match%: ${s.match_percentage} | Tier: ${s.tier} | State: ${s.state}`);
  });

  process.exit(0);
}

testAll().catch(e => { console.error(e); process.exit(1); });
