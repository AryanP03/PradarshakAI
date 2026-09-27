import { scoreSchemes } from '../services/SchemeEngine';
import { pool } from '../db/pool';

async function runTest() {
  const query = "I am a 55-year-old man from Assam, SC community, recently diagnosed with cancer, and I need financial assistance for treatment costs.";
  
  // Fetch Ayushman Bharat (52) and SC/ST Cancer Assam (109) + some random scheme for control
  const res = await pool.query("SELECT * FROM schemes WHERE id IN (52, 109, 6)");
  const schemes = res.rows;
  
  const entities = {
    purpose: query,
    gender: 'male',
    state: 'Assam',
    age: 55
  };
  
  console.log('=== QUERY: ' + query + ' ===');
  scoreSchemes(schemes, entities).forEach(s => console.log(`${s.name} (ID: ${s.id}): Score ${s.score}`));
}

runTest().then(() => process.exit(0)).catch(console.error);
