import { recommendSchemes } from '../services/SchemeEngine';

async function test() {
  console.log('--- Query 1: Grant (Telangana, 2L income) ---');
  const res1 = await recommendSchemes({
    purpose: "start a small business and I don't want to take any loan. Is there a grant scheme?",
    family_income_rs: 200000,
    state: "Telangana"
  }, undefined, 5);
  console.log(res1.slice(0, 3).map(s => `${s.name} (ID: ${s.id}, Score: ${s.score}, Tier: ${s.tier}, Match: ${s.matchReasons})`));

  console.log('\n--- Query 2: Interest-free (Bihar, Food processing) ---');
  const res2 = await recommendSchemes({
    purpose: "interest-free loan of ₹8 lakh for food processing",
    loan_amount_rs: 800000,
    state: "Bihar"
  }, undefined, 5);
  console.log(res2.slice(0, 3).map(s => `${s.name} (ID: ${s.id}, Score: ${s.score}, Tier: ${s.tier}, Match: ${s.matchReasons})`));

  console.log('\n--- Query 3: Overseas Masters (5.5L income) ---');
  const res3 = await recommendSchemes({
    purpose: "overseas master's",
    family_income_rs: 550000,
  }, undefined, 5);
  console.log(res3.slice(0, 3).map(s => `${s.name} (ID: ${s.id}, Score: ${s.score}, Tier: ${s.tier}, Match: ${s.matchReasons})`));

  process.exit(0);
}
test().catch(console.error);
