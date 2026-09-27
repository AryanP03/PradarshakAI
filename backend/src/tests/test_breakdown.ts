import { scoreSchemes } from '../services/SchemeEngine';
import { pool } from '../db/pool';

async function runTest() {
  const query1 = "I want to open my own farm at my village, please recommend some schemes for it.";
  const query2 = "I want a business loan for an urban shop";
  
  const res = await pool.query("SELECT * FROM schemes WHERE id IN (5, 6, 40, 48, 49)");
  const schemes = res.rows;
  
  // Exclude loan amounts to test pure semantic matching
  const entities1 = { purpose: query1, gender: 'male' };
  const entities2 = { purpose: query2, gender: 'male' };
  
  console.log('=== QUERY: ' + query1 + ' ===');
  scoreSchemes(schemes, entities1).forEach(s => console.log(`${s.name} (ID: ${s.id}): Score ${s.score}`));
  
  console.log('\n=== QUERY: ' + query2 + ' ===');
  scoreSchemes(schemes, entities2).forEach(s => console.log(`${s.name} (ID: ${s.id}): Score ${s.score}`));
}

runTest().then(() => process.exit(0)).catch(console.error);
