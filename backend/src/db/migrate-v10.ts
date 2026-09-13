import { readFileSync } from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const ssl = process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_SSL === 'true'
  ? { ssl: { rejectUnauthorized: false } }
  : {};

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ...ssl });

async function run() {
  const schemaV10 = readFileSync(path.join(__dirname, 'schema-v10-job-business.sql'), 'utf8');

  console.log('Applying Schema v10 (Job / Business Other column for Users)…');
  await pool.query(schemaV10);
  console.log('Schema v10 applied successfully.');

  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name IN ('education_level', 'trade_category', 'funding_bracket', 'job_business_other');
  `);

  console.log('\n📊 User Table Livelihood Columns:');
  res.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

  await pool.end();
  console.log('\nMigration v10 Complete.');
}

run().catch((err) => {
  console.error('Migration v10 failed:', err.message);
  process.exit(1);
});
