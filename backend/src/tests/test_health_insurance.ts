const { pool } = require('../db/pool');
const { scoreSchemes } = require('../services/SchemeEngine');

async function testHealthInsurance() {
  const { rows: allSchemes } = await pool.query('SELECT * FROM schemes WHERE active = true');
  
  const query = "suggest me some good health insurance schemes";
  const entities = { purpose: query };
  
  // Test with undefined categoryHint
  console.log("--- SCORES WITH categoryHint = undefined ---");
  let scored = scoreSchemes(allSchemes, entities, undefined);
  let id52 = scored.find(s => s.id === 52);
  console.log(`[ID 52] Ayushman Bharat | Tier: ${id52?.tier} | Score: ${id52?.score}`);
  
  // Test with 'business_loan' categoryHint
  console.log("--- SCORES WITH categoryHint = 'business_loan' ---");
  scored = scoreSchemes(allSchemes, entities, 'business_loan');
  id52 = scored.find(s => s.id === 52);
  console.log(`[ID 52] Ayushman Bharat | Tier: ${id52?.tier} | Score: ${id52?.score}`);
  
  process.exit(0);
}

testHealthInsurance().catch(console.error);
