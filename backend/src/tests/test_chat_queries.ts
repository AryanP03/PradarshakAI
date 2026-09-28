import dotenv from 'dotenv';
dotenv.config();

import { process } from '../services/ChatOrchestrator';

async function run() {
  const queries = [
    {
      title: 'Query 1: Class 10 Scholarship',
      message: 'any scholarships for my Class 10 daughter',
      userContext: { casteCategory: 'SC', state: 'Uttar Pradesh' },
    },
    {
      title: 'Query 2: 62-Year-Old Pension',
      message: '62-year-old pension eligibility',
      userContext: { age: 62, casteCategory: 'SC', state: 'Uttar Pradesh' },
    },
    {
      title: 'Query 3: SC Health Insurance',
      message: 'SC health insurance schemes',
      userContext: { casteCategory: 'SC', state: 'Uttar Pradesh' },
    },
    {
      title: 'Query 4: Zero Match Query (Crypto Mining)',
      message: 'are there any government subsidies for cryptocurrency mining rig setup',
      userContext: { casteCategory: 'General' },
    }
  ];

  console.log('=== RUNNING CHAT ORCHESTRATOR REAL END-TO-END TESTS ===\n');

  for (const q of queries) {
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`TEST: ${q.title}`);
    console.log(`User Query: "${q.message}"`);
    console.log(`User Context:`, JSON.stringify(q.userContext));
    
    try {
      const sessionId = 'test-session-' + Date.now() + '-' + Math.random().toString(36).substring(7);
      const res = await process(
        q.message,
        sessionId,
        'en',
        undefined,
        undefined,
        undefined,
        q.userContext as any
      );

      console.log(`\nRESULT TYPE: ${res.type}`);
      console.log(`INTENT: ${res.intent}`);
      const schemes = (res.data as any)?.schemes || [];
      console.log(`CARDS SHOWN (${schemes.length}):`);
      schemes.forEach((s: any, idx: number) => {
        console.log(`  ${idx + 1}. [${s.code || s.id}] ${s.name} (Category: ${s.category}, Score: ${s.score || s.relevance_score || 'N/A'})`);
      });

      console.log(`\nCHAT MESSAGE TEXT:`);
      console.log(res.message);
      console.log(`\n--------------------------------------------------------------------------------\n`);
    } catch (err) {
      console.error(`ERROR running test "${q.title}":`, err);
    }
  }
}

run().catch(console.error);
