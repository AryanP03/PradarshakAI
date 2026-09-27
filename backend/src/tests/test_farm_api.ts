import { process as processMessage } from '../services/ChatOrchestrator';

async function testFarmAPI() {
  console.log('=== QUERY: I want to open my own farm at my village, please recommend some schemes for it. ===');
  const res = await processMessage('I want to open my own farm at my village, please recommend some schemes for it.', 'test-129', 'en', 'en', 1, undefined, { gender: 'male', caste_category: 'SC' });
  console.log(JSON.stringify(res, null, 2));
}
testFarmAPI().then(() => process.exit(0)).catch(console.error);
