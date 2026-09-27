const { pool } = require('../db/pool');
const { scoreSchemes } = require('../services/SchemeEngine');

async function run() {
  const { rows: allSchemes } = await pool.query('SELECT * FROM schemes WHERE active = true');
  const nulmIdRows = await pool.query("SELECT id, name FROM schemes WHERE name ILIKE '%NULM%' OR name ILIKE '%urban livelihood%'");
  
  console.log("NULM Scheme IDs found:", nulmIdRows.rows.map(r => `${r.id}: ${r.name}`));

  const query = "I want to open my own farm at my village, please recommend some schemes for it.";
  // We mock entities exactly as the orchestrator/engine would extract them
  // "village" -> rural? "farm" -> agriculture?
  const entities = {
    purpose: "open my own farm at my village",
  };
  
  const scored = scoreSchemes(allSchemes, entities, 'business_loan');
  
  const targetIds = [5, 40, 48, ...nulmIdRows.rows.map(r => r.id)];
  console.log("\n--- SCORES FOR TARGET SCHEMES ---");
  targetIds.forEach(id => {
    const s = scored.find(x => x.id === id);
    if (s) {
      console.log(`[ID ${s.id}] ${s.name} | Tier: ${s.tier} | Score: ${s.score}`);
    } else {
      console.log(`[ID ${id}] Not found in scored results`);
    }
  });

  console.log("\n--- TOP 10 OVERALL SCORES ---");
  scored.slice(0, 10).forEach(s => {
    console.log(`[ID ${s.id}] ${s.name} | Tier: ${s.tier} | Score: ${s.score}`);
  });
  
  process.exit(0);
}

run().catch(console.error);
