import { fetchActiveSchemes, scoreSchemes } from '../services/SchemeEngine';

async function run() {
  const all = await fetchActiveSchemes();
  const scored = scoreSchemes(all, { purpose: "I want to open my own agriculture farm, my income is below 1 lakh", gender: undefined });
  const id3 = scored.find(s => s.id === 3);
  console.log(id3);
}
run().then(() => process.exit(0)).catch(console.error);
