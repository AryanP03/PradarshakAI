async function run() {
  const url = 'http://127.0.0.1:4000/api/recommend/finder';

  console.log('--- TEST A: /api/recommend/finder with purpose: "I want to pursue a PhD" ---');
  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purpose: 'I want to pursue a PhD' })
  });
  let data = await res.json();
  (data.schemes || []).forEach((s: any, i: number) => {
    console.log(`  ${i+1}. [ID ${s.id}] "${s.name}" | Score: ${s.score} | Match: ${s.matchPercentage}% | Tier: ${s.tier} | State: ${s.state}`);
  });

  console.log('\n--- TEST B: /api/recommend/finder with housing query ---');
  res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purpose: 'I want to buy a new house, my income is 1 lakh, I belong to SC category', family_income_rs: 100000 })
  });
  data = await res.json();
  (data.schemes || []).forEach((s: any, i: number) => {
    console.log(`  ${i+1}. [ID ${s.id}] "${s.name}" | Score: ${s.score} | Match: ${s.matchPercentage}% | Tier: ${s.tier} | State: ${s.state}`);
  });

  process.exit(0);
}

run();
