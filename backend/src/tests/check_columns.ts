import { pool } from '../db/pool';

async function checkColumns() {
  const res = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'schemes' 
    ORDER BY ordinal_position;
  `);
  console.log('Columns in live schemes table:');
  res.rows.forEach(r => {
    console.log(`- ${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`);
  });

  // Also check if updated_schemes exists and its columns
  const res2 = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'updated_schemes' 
    ORDER BY ordinal_position;
  `);
  console.log('\nColumns in updated_schemes table:');
  res2.rows.forEach(r => {
    console.log(`- ${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`);
  });

  await pool.end();
}

checkColumns().catch(err => {
  console.error(err);
  process.exit(1);
});
