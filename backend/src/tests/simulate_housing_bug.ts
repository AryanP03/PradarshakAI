import { extractAndUpdateFacts } from '../services/ConversationSession';
import { fetchActiveSchemes, scoreSchemes, recommendSchemes } from '../services/SchemeEngine';

async function testSimulate() {
  console.log('=== TEST 1: extractAndUpdateFacts for Housing Message ===');
  const msg = 'I want to buy a new house, my income is 1 lakh, I belong to SC category';
  const facts1 = extractAndUpdateFacts({}, msg);
  console.log('Fresh facts from message:', JSON.stringify(facts1, null, 2));

  console.log('\n=== TEST 2: extractAndUpdateFacts if session previously had transport facts ===');
  const priorFacts = {
    business_type: 'transport / e-rickshaw',
    category_hint: 'business_loan',
    state: 'Gujarat',
  };
  const facts2 = extractAndUpdateFacts({ ...priorFacts }, msg);
  console.log('Facts after housing query over prior transport session:', JSON.stringify(facts2, null, 2));

  console.log('\n=== TEST 3: recommendSchemes with fresh housing purpose ===');
  const resFresh = await recommendSchemes({
    purpose: 'I want to buy a new house',
    family_income_rs: 100000,
  });
  console.log('Fresh housing recommendations:');
  resFresh.forEach((s, i) => console.log(`${i+1}. [ID ${s.id}] ${s.name} (Score: ${s.score}, Tier: ${s.tier}, Match%: ${s.match_percentage})`));

  console.log('\n=== TEST 4: recommendSchemes with contaminated facts (Gujarat + transport) ===');
  const resContaminated = await recommendSchemes({
    purpose: 'transport / e-rickshaw - I want to buy a new house',
    family_income_rs: 100000,
    state: 'Gujarat',
  });
  console.log('Contaminated recommendations:');
  resContaminated.forEach((s, i) => console.log(`${i+1}. [ID ${s.id}] ${s.name} (Score: ${s.score}, Tier: ${s.tier}, Match%: ${s.match_percentage})`));

  process.exit(0);
}

testSimulate().catch(e => { console.error(e); process.exit(1); });
