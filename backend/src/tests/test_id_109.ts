import { scoreSchemes } from '../services/SchemeEngine';
import { pool } from '../db/pool';

async function runTest() {
  const query = "I am a 55-year-old man from Assam, SC community, recently diagnosed with cancer, and I need financial assistance for treatment costs.";
  const res = await pool.query("SELECT * FROM schemes WHERE id = 109");
  const schemes = res.rows;
  const entities = { purpose: query, gender: 'male', state: 'Assam', age: 55 };
  
  const scored = scoreSchemes(schemes, entities);
  console.log(JSON.stringify(scored[0], null, 2));
}

runTest().then(() => process.exit(0)).catch(console.error);
