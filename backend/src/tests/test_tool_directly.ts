import { executeTool } from '../services/Tools';

async function runTest() {
  const res = await executeTool('recommend_schemes', {
    query: 'I am a 55-year-old man from Assam, SC community, recently diagnosed with cancer, and I need financial assistance for treatment costs.',
    purpose: 'cancer treatment financial assistance',
    state: 'Assam',
    category_hint: 'welfare',
    gender: 'male'
  });
  
  console.log(JSON.stringify(res, null, 2));
}

runTest().then(() => process.exit(0)).catch(console.error);
