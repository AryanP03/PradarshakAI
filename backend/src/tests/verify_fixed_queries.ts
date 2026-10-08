import { readonlyPool } from '../db/pool';
import { scoreSchemes, recommendSchemes } from '../services/SchemeEngine';
import { process as chatProcess } from '../services/ChatOrchestrator';

async function main() {
  console.log('========================================================================');
  console.log('PART 1: Full Score Breakdown for Query 1');
  console.log('"34-year-old man from Tamil Nadu, SC, income ₹1.8 lakh, wants to expand a grocery shop"');
  console.log('========================================================================\n');

  const { rows: schemes113_116_1 } = await readonlyPool.query(
    'SELECT * FROM schemes WHERE id IN (113, 116, 1) ORDER BY id ASC'
  );

  const entities1 = {
    purpose: '34-year-old man from Tamil Nadu, SC, income ₹1.8 lakh, wants to expand a grocery shop',
    family_income_rs: 180000,
    gender: 'male',
    age: 34,
    state: 'Tamil Nadu',
  };

  const scored1 = scoreSchemes(schemes113_116_1, entities1, 'business_loan');
  for (const s of scored1) {
    console.log(`Scheme ID ${s.id}: ${s.name}`);
    console.log(`  Level: ${s.level || 'Central'} | State: ${s.state} | Category: ${s.category}`);
    console.log(`  Tier: ${s.tier}`);
    console.log(`  Final Score: ${s.score} | Match Percentage: ${s.match_percentage}%`);
    console.log(`  Match Reasons:`, s.matchReasons);
    console.log(`  Warnings:`, s.warnings);
    if (s.disqualificationReason) console.log(`  Disqualification Reason:`, s.disqualificationReason);
    console.log('');
  }

  console.log('------------------------------------------------------------------------');
  console.log('Running Query 1 through chatProcess...');
  const chatRes1 = await chatProcess(
    '34-year-old man from Tamil Nadu, SC, income ₹1.8 lakh, wants to expand a grocery shop',
    undefined
  );
  console.log('Chat Response Status:', chatRes1.type);
  console.log('Chat Message Text:\n', chatRes1.message);
  const recSchemes1 = (chatRes1.data?.schemes as any[]) || [];
  console.log('Recommended Schemes Top 3:');
  recSchemes1.forEach((s, i) => {
    console.log(`  #${i + 1} [ID ${s.id}] ${s.name} (${s.match_percentage}%, score: ${s.score}, state: ${s.state})`);
  });

  console.log('\n========================================================================');
  console.log('PART 2: Multi-Turn Session for Kerala Stationery/Bookstore');
  console.log('Turn 1: "30-year-old from Kerala, SC, income ₹2 lakh, stationery and bookstore business"');
  console.log('========================================================================\n');

  const sessionId = `test-kerala-${Date.now()}`;
  const turn1Res = await chatProcess(
    '30-year-old from Kerala, SC, income ₹2 lakh, stationery and bookstore business',
    sessionId
  );
  console.log('Turn 1 Response Status:', turn1Res.type);
  console.log('Turn 1 Message Text:\n', turn1Res.message);
  const recTurn1 = (turn1Res.data?.schemes as any[]) || [];
  console.log('Turn 1 Recommended Schemes:');
  recTurn1.forEach((s, i) => {
    console.log(`  #${i + 1} [ID ${s.id}] ${s.name} (${s.match_percentage}%, score: ${s.score}, state: ${s.state})`);
  });

  console.log('\n========================================================================');
  console.log('Turn 2 (Same Session): "is there any Kerala state specific scheme that may help me?"');
  console.log('========================================================================\n');

  const turn2Res = await chatProcess(
    'is there any Kerala state specific scheme that may help me?',
    sessionId
  );
  console.log('Turn 2 Response Status:', turn2Res.type);
  console.log('Turn 2 Message Text:\n', turn2Res.message);
  const recTurn2 = (turn2Res.data?.schemes as any[]) || [];
  console.log('Turn 2 Recommended Schemes:');
  recTurn2.forEach((s, i) => {
    console.log(`  #${i + 1} [ID ${s.id}] ${s.name} (${s.match_percentage}%, score: ${s.score}, level: ${s.level}, state: ${s.state})`);
  });

  await readonlyPool.end();
}

main().catch(console.error);
