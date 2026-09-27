import { process as orchestrate } from '../services/ChatOrchestrator';

async function testLiveChat() {
  console.log('--- Calling orchestrate for housing query ---');
  const res = await orchestrate(
    'I want to buy a new house, my income is 1 lakh, I belong to SC category',
    'test-session-housing-' + Date.now(),
    'en'
  );

  console.log('Result type:', res.type);
  console.log('Assistant message text:\n', res.message);
  console.log('Data schemes returned:');
  const schemes = (res.data?.schemes as any[]) || [];
  schemes.forEach((s, idx) => {
    console.log(`${idx + 1}. [ID ${s.id}] "${s.name}" (Score: ${s.score}, Tier: ${s.tier}, match%: ${s.match_percentage})`);
  });

  process.exit(0);
}

testLiveChat().catch(e => { console.error(e); process.exit(1); });
