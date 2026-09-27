import { executeTool } from '../services/Tools';

async function runTests() {
  const queries = [
    {
      query: 'I need general health insurance for my family.',
      purpose: 'general health insurance',
      state: 'Madhya Pradesh',
      category_hint: 'welfare',
      gender: 'male',
      age: 40
    },
    {
      query: 'Is there any accident insurance scheme available?',
      purpose: 'accident insurance',
      state: 'Gujarat',
      category_hint: 'welfare',
      gender: 'female',
      age: 30
    },
    {
      query: 'I am pregnant and looking for maternity benefits.',
      purpose: 'maternity benefit',
      state: 'Bihar',
      category_hint: 'welfare',
      gender: 'female',
      age: 25
    },
    {
      query: 'I need financial help for critical illness treatment in Maharashtra.',
      purpose: 'critical illness treatment cancer',
      state: 'Maharashtra',
      category_hint: 'welfare',
      gender: 'male',
      age: 50
    },
    {
      query: 'I am a 65-year-old looking for old-age pension.',
      purpose: 'old age pension',
      state: 'Kerala',
      category_hint: 'welfare',
      gender: 'male',
      age: 65
    }
  ];

  for (const q of queries) {
    console.log(`\n=== QUERY: ${q.query} ===`);
    const res = await executeTool('recommend_schemes', q);
    const schemes = res.data.schemes as any[];
    if (schemes && schemes.length > 0) {
      schemes.forEach(s => console.log(`${s.name} (ID: ${s.id}) - Score: ${s.score}, Tier: ${s.tier}`));
    } else {
      console.log('No schemes found.');
    }
  }
}

runTests().then(() => process.exit(0)).catch(console.error);
