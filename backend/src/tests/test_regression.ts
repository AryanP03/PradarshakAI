import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { process as generateChatResponse } from '../services/ChatOrchestrator';

const queries = [
  // The 3 problematic ones
  "I want a grant, not a loan",
  "interest-free loan of ₹8 lakh for food processing",
  "overseas master's, ₹5.5L income",

  // Business - State specific
  "I need ₹50,000 for a tailoring business in Maharashtra",
  "dairy farming loan in Gujarat",
  "retail shop loan in Delhi",
  "manufacturing unit in Tamil Nadu with 3 lakh income",

  // Business - No state
  "I want to start a beauty parlour, what loans are available?",
  "loan for buying a commercial vehicle",

  // Education - State specific
  "education loan for engineering college in Karnataka",
  "diploma course loan in Kerala",

  // Education - No state
  "I need money to pay my school fees",
  "loan for medical college admission",

  // Health / Welfare - State specific
  "medical emergency help in Jharkhand",
  "health insurance scheme in Rajasthan",

  // Health / Welfare - No state
  "is there any scheme for pregnant women?",
  "financial help for marriage of daughter",
  "pension scheme for widows"
];

async function runTests() {
  console.log('Starting Regression Test Suite...');
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    const sessionId = `test_session_${Date.now()}_${i}`;
    console.log(`\n======================================================`);
    console.log(`Query ${i + 1}/${queries.length}: "${query}"`);
    console.log(`======================================================`);
    
    try {
      const res = await generateChatResponse(query, sessionId, 'en');
      
      const schemes: any[] = (res.data as any)?.schemes || [];
      const schemeIds = schemes.map((s: any) => s.id);
      
      console.log('\n[SCORED CANDIDATES]:');
      if (schemes.length > 0) {
        schemes.forEach((s: any) => {
          console.log(`  - ${s.name} (ID: ${s.id}, Score: ${s.score || 'N/A'}, Tier: ${s.tier || 'N/A'})`);
        });
      } else {
        console.log('  None');
      }
      
      console.log('\n[FINAL TEXT]:\n' + res.message);
      
      const namesToVerify = ["Startup India Seed Fund Scheme", "state-level MSME grant programmes"];
      for (const name of namesToVerify) {
        if (res.message?.includes(name)) {
          console.log(`[WARNING] Hallucinated scheme name found in text: ${name}`);
        }
      }
      
    } catch (e) {
      console.error('[ERROR] Failed to run query:', e);
    }
    
    await new Promise(r => setTimeout(r, 20000));
  }
  
  console.log('\n✅ Regression tests completed.');
  process.exit(0);
}

runTests();
