import { fetchActiveSchemes, scoreSchemes } from '../services/SchemeEngine';

async function run() {
  const all = await fetchActiveSchemes();
  const query = "I need medical insurance for my family";
  const scored = scoreSchemes(all, { purpose: query });
  
  scored.slice(0, 5).forEach((s) => {
    console.log(`- [ID ${s.id}] ${s.name} (Score: ${s.score}, Match: ${s.match_percentage}%, Tier: ${s.tier})`);
  });
  
  const id52 = scored.find(s => s.id === 52);
  if (id52) {
    console.log(`\nID 52 Details:`);
    console.log(id52.disqualificationReason);
    console.log(id52.warnings);
  }
}
run().then(() => process.exit(0)).catch(console.error);
