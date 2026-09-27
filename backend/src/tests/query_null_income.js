const { pool } = require('./src/db/pool');
async function run() {
  const { rows } = await pool.query('SELECT id, name, max_income_lakh, family_income_limit FROM schemes WHERE max_income_lakh IS NULL LIMIT 20;');
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
run();
