async function run() {
  const url = 'http://127.0.0.1:4000/api/chat';
  const query = 'I want to buy a new house, my family income is less than 1 lakh, I belong from SC community.';

  console.log('--- TEST: /api/chat with new housing query ---');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query })
    });
    const data = await res.json();
    console.log('RESPONSE TEXT:');
    console.log(data.response || data.message);
    console.log('\nRETURNED SCHEMES (CARDS):');
    const schemes = data.data?.schemes || data.schemes || [];
    if (schemes.length > 0) {
      for (const s of schemes) {
        console.log(`- [ID ${s.id}] "${s.name}" | Match: ${s.matchPercentage || s.match_percentage}% | Tier: ${s.tier || s.eligibility_tier} | State: ${s.state}`);
      }
    } else {
      console.log('  None returned.');
    }
  } catch (err) {
    console.error('Error fetching chat:', err);
  }
  process.exit(0);
}

run();
