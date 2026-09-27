import { process as processMessage } from '../services/ChatOrchestrator';

async function testHealthAPI() {
  console.log('=== QUERY: I want some health insurance, suggest some good schemes ===');
  const res = await processMessage('I want some health insurance, suggest some good schemes', 'test-130', 'en', 'en', 1, undefined, { gender: 'male', caste_category: 'SC', salary: 100000 });
  console.log(JSON.stringify(res, null, 2));
}
testHealthAPI().then(() => process.exit(0)).catch(console.error);
