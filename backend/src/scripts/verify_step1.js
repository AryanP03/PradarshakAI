const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function compareRows() {
  const oldRes = await pool.query('SELECT id, name, category, gender_eligibility, min_income_lakh, max_income_lakh, min_loan_lakh, max_loan_lakh FROM schemes WHERE id <= 14 ORDER BY id');
  const newRes = await pool.query('SELECT id, name, category, gender_eligibility, min_income_lakh, max_income_lakh, min_loan_lakh, max_loan_lakh FROM updated_schemes WHERE id <= 14 ORDER BY id');

  console.log(`Found ${oldRes.rows.length} rows in schemes and ${newRes.rows.length} in updated_schemes.`);

  const discrepancies = [];

  for (let i = 0; i < 14; i++) {
    const o = oldRes.rows[i];
    const n = newRes.rows[i];

    if (!o || !n) {
      discrepancies.push({ id: i + 1, error: `Missing row in ${!o ? 'schemes' : 'updated_schemes'}` });
      continue;
    }

    const fields = ['name', 'category', 'gender_eligibility', 'min_income_lakh', 'max_income_lakh', 'min_loan_lakh', 'max_loan_lakh'];
    const diffs = {};
    for (const f of fields) {
      const valO = o[f] !== null ? String(o[f]) : null;
      const valN = n[f] !== null ? String(n[f]) : null;
      if (valO !== valN) {
        diffs[f] = { old: valO, new: valN };
      }
    }
    if (Object.keys(diffs).length > 0) {
      discrepancies.push({ id: o.id, name: o.name, diffs });
    }
  }

  console.log('Discrepancies found:');
  console.log(JSON.stringify(discrepancies, null, 2));

  await pool.end();
}

compareRows().catch(err => {
  console.error(err);
  process.exit(1);
});
