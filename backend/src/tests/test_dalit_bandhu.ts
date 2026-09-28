import { readonlyPool } from '../db/pool';

async function test() {
  const { rows } = await readonlyPool.query('SELECT * FROM schemes WHERE id = 172 OR id = 148');
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
test().catch(console.error);
