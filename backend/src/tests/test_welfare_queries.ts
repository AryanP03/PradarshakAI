async function testQueries() {
  const queries = [
    "suggest me some good health insurance schemes",
    "tell me about pension schemes for SC citizens",
    "are there any scholarship schemes for SC students",
    "what schemes exist for SC farmers"
  ];

  for (const q of queries) {
    console.log(`\n\n=== QUERY: "${q}" ===`);
    const res = await fetch('http://localhost:4000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: q })
    });
    
    const data = await res.json();
    console.log("RESPONSE:\n" + (data.message || data.response));
    
    if (data.data && data.data.schemes && data.data.schemes.length > 0) {
      console.log("\nRETURNED SCHEMES:");
      data.data.schemes.slice(0,3).forEach((s: any) => {
        console.log(` - [ID ${s.id}] ${s.name} (Tier: ${s.tier}, Score: ${s.score})`);
      });
    } else {
      console.log("\nNo schemes returned.");
    }
  }
}

testQueries().catch(console.error);
