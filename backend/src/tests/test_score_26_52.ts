import { pool } from '../db/pool';
import { scoreSchemes } from '../services/SchemeEngine';

async function testScore() {
  const query = "I want some health insurance, suggest some good schemes";
  const { rows: schemes } = await pool.query('SELECT * FROM schemes WHERE id IN (26, 52)');
  
  const scored = scoreSchemes(schemes, { purpose: query });
  
  scored.forEach((s) => {
    console.log(`[ID ${s.id}] Score: ${s.score}, Match: ${s.match_percentage}%, pScore: ${s.score - 35}`);
  });
}
testScore().then(() => process.exit(0)).catch(console.error);
