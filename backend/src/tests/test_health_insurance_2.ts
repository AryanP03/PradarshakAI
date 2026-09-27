import { pool } from '../db/pool';
import { scoreSchemes } from '../services/SchemeEngine';

async function testQuery() {
  const query = "I want some health insurance, suggest some good schemes";
  const { rows: allSchemes } = await pool.query('SELECT * FROM schemes WHERE active = true');
  
  const scored = scoreSchemes(allSchemes, { purpose: query });
  
  console.log("Top 5 Results:");
  scored.slice(0, 5).forEach((s, i) => {
    console.log(`${i+1}. [ID ${s.id}] ${s.name} (Tier: ${s.tier}, Score: ${s.score}, Match: ${s.match_percentage}%)`);
  });

  const ab = scored.find(s => s.id === 52);
  if (ab) {
    console.log("\nDetails for Ayushman Bharat (ID 52):");
    console.log(`Tier: ${ab.tier}, Score: ${ab.score}, Match: ${ab.match_percentage}%`);
    console.log("Reasons:", ab.matchReasons);
    console.log("Warnings:", ab.warnings);
  } else {
    console.log("\nAyushman Bharat (ID 52) was NOT in the scored list (likely hard disqualified).");
    const s = allSchemes.find(s => s.id === 52);
    const manual = scoreSchemes([s], { purpose: query });
    console.log("\nManual trace for ID 52:");
    console.log(manual[0]);
  }
}

testQuery().then(() => process.exit(0)).catch(console.error);
