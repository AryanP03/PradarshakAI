import { recommendSchemes } from '../services/SchemeEngine';
import { pool } from '../db/pool';

async function test() {
  const result = await recommendSchemes({
    purpose: "overseas master's",
    family_income_rs: 550000
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
test().catch(console.error);
