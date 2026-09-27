import { process as processMessage } from '../services/ChatOrchestrator';

async function testHousingAPI() {
  console.log('=== QUERY: I want to buy a new house, my family income is less than 1 lakh, I belong from SC community. ===');
  const res = await processMessage('I want to buy a new house, my family income is less than 1 lakh, I belong from SC community.', 'test-128', 'en', 'en', 1, undefined, { gender: 'male', caste_category: 'SC', salary: 100000 });
  console.log(JSON.stringify(res, null, 2));
}
testHousingAPI().then(() => process.exit(0)).catch(console.error);
