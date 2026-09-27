async function testChat() {
  const queries = [
    "I want some health insurance, suggest some good schemes",
    "I need medical insurance for my family",
    "are there any accident insurance schemes",
    "I want life insurance coverage"
  ];
  for (const q of queries) {
    console.log(`\n\n=== QUERY: "${q}" ===`);
    const res = await fetch('http://localhost:4000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: q })
    });
    const data = await res.json();
    if (data.data && data.data.schemes) {
      data.data.schemes.forEach((s: any) => {
        console.log(`  - [ID ${s.id}] ${s.name} (Match: ${s.matchPercentage || s.match_percentage}%, Tier: ${s.tier})`);
      });
    } else {
      console.log('  None returned.');
    }
  }
}
testChat().catch(console.error);
