import { pool } from '../db/pool';

async function fix23() {
  await pool.query(`
    UPDATE schemes
    SET education_level = 'overseas',
        education_levels = ARRAY['overseas']
    WHERE id IN (23, 24, 119)
  `);
  console.log('Updated overseas schemes (23, 24, 119) to education_levels = ARRAY["overseas"]');
  process.exit(0);
}

fix23().catch(e => { console.error(e); process.exit(1); });
