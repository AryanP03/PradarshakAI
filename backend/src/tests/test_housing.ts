import { executeTool } from '../services/Tools';
import { recommendSchemes, fetchActiveSchemes, scoreSchemes } from '../services/SchemeEngine';

async function testHousing() {
  const all = await fetchActiveSchemes();
  const query = "I want to buy a new house, my family income is less than 1 lakh, I belong from SC community.";
  console.log("=== QUERY:", query, "===");
  const scored = scoreSchemes(all, { purpose: query, family_income_rs: 100000 });
  
  scored.slice(0, 5).forEach(s => {
    console.log(`- [ID ${s.id}] ${s.name} (Match: ${s.match_percentage}%, Tier: ${s.tier}, pScore: ${s.score})`);
  });

  const ids = [50, 51];
  ids.forEach(id => {
    const s = scored.find(x => x.id === id);
    if (!s) {
       console.log(`ID ${id} was filtered out completely!`);
    } else {
       console.log(`ID ${id} - ${s.name}, Score: ${s.score}, Tier: ${s.tier}, Disq: ${s.disqualificationReason}`);
    }
  });
}
testHousing().then(() => process.exit(0)).catch(console.error);
