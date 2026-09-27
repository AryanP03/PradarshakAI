async function run() {
  const url = 'http://127.0.0.1:4000/api/chat';
  const queries = [
    'I want to pursue a PhD',
    'I want to buy a new house, my income is 1 lakh, I belong to SC category'
  ];

  for (const q of queries) {
    console.log('====================================================');
    console.log('QUERY:', q);
    console.log('====================================================');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q })
      });
      const data = await res.json();
      console.log('RESPONSE TEXT:');
      console.log(data.response || data.message);
      console.log('\nRETURNED SCHEMES (CARDS):');
      if (data.schemes && data.schemes.length > 0) {
        for (const s of data.schemes) {
          console.log(`- [ID ${s.id}] "${s.name}" | Match: ${s.matchPercentage || s.match_percentage}% | Tier: ${s.tier || s.eligibility_tier} | State: ${s.state}`);
        }
      } else {
        console.log('  None returned.');
      }
    } catch (err) {
      console.error('Error fetching chat:', err);
    }
    console.log('\n');
  }
  process.exit(0);
}

run();
