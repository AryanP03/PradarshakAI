import { process as processMessage } from '../services/ChatOrchestrator';

async function testCancerAPI() {
  console.log('=== QUERY: I am a 55-year-old man from Assam, SC community, recently diagnosed with cancer, and I need financial assistance for treatment costs. ===');
  const res = await processMessage(
    'I am a 55-year-old man from Assam, SC community, recently diagnosed with cancer, and I need financial assistance for treatment costs.',
    'test-131',
    'en',
    'en',
    1,
    undefined,
    { gender: 'male', caste_category: 'SC', state: 'Assam', age: 55 }
  );
  console.log(JSON.stringify(res, null, 2));
}

testCancerAPI().then(() => process.exit(0)).catch(console.error);
