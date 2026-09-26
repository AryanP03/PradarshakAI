const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

function parseCSV(content) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  return rows;
}

function parseNumber(val) {
  if (val === undefined || val === null || val === '') return null;
  const cleaned = String(val).trim().replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

function parseIntNumber(val) {
  if (val === undefined || val === null || val === '') return null;
  const cleaned = String(val).trim().replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

function parseBoolean(val, defaultVal = false) {
  if (val === undefined || val === null || val === '') return defaultVal;
  const str = String(val).trim().toUpperCase();
  if (str === 'TRUE' || str === 'YES' || str === '1') return true;
  if (str === 'FALSE' || str === 'NO' || str === '0') return false;
  return defaultVal;
}

function parseArray(val) {
  if (!val || val.trim() === '') return [];
  const trimmed = val.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(s => String(s).trim());
    } catch {
      // fallback to split
    }
  }
  return trimmed.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
}

function parseDate(val) {
  if (!val || val.trim() === '') return null;
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return null;
}

async function upload() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  console.log('Connecting to database...');
  const client = await pool.connect();

  try {
    const csvPath = path.join(__dirname, '../db/updated_schemes.csv');
    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(content);

    console.log(`Parsed ${rows.length - 1} rows from CSV`);
    const dataRows = rows.slice(1);

    await client.query('BEGIN');

    console.log('Creating/recreating updated_schemes table...');
    await client.query('DROP TABLE IF EXISTS updated_schemes CASCADE;');

    await client.query(`
      CREATE TABLE updated_schemes (
        id INT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        min_income_lakh NUMERIC,
        max_income_lakh NUMERIC,
        min_loan_lakh NUMERIC,
        max_loan_lakh NUMERIC,
        interest_rate_min NUMERIC,
        interest_rate_max NUMERIC,
        moratorium_months_min INT,
        moratorium_months_max INT,
        max_tenure_months INT,
        coverage_percent NUMERIC,
        eligible_project_types TEXT[],
        education_required BOOLEAN DEFAULT FALSE,
        notes TEXT,
        active BOOLEAN DEFAULT TRUE,
        short_name TEXT,
        gender_eligibility TEXT DEFAULT 'all',
        age_min INT,
        age_max INT,
        documents_required TEXT[],
        channel_partner_types TEXT[],
        min_tenure_months INT,
        source TEXT DEFAULT 'official',
        last_updated DATE DEFAULT CURRENT_DATE,
        scheme_type TEXT DEFAULT 'financing',
        official_source TEXT,
        official_source_url TEXT,
        aliases TEXT[],
        current_official_name TEXT,
        channel_partner_applicable BOOLEAN DEFAULT TRUE,
        for_sc TEXT,
        for_st TEXT,
        target_beneficiary TEXT,
        state_or_body TEXT,
        state TEXT,
        level TEXT,
        family_income_limit TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_updated_schemes_category ON updated_schemes(category);
      CREATE INDEX IF NOT EXISTS idx_updated_schemes_active ON updated_schemes(active);
      CREATE INDEX IF NOT EXISTS idx_updated_schemes_state ON updated_schemes(state);
      CREATE INDEX IF NOT EXISTS idx_updated_schemes_level ON updated_schemes(level);
    `);

    console.log('Inserting 198 schemes into updated_schemes...');

    const insertQuery = `
      INSERT INTO updated_schemes (
        id, name, category, description,
        min_income_lakh, max_income_lakh, min_loan_lakh, max_loan_lakh,
        interest_rate_min, interest_rate_max,
        moratorium_months_min, moratorium_months_max,
        max_tenure_months, coverage_percent,
        eligible_project_types, education_required,
        notes, active, short_name, gender_eligibility,
        age_min, age_max, documents_required, channel_partner_types,
        min_tenure_months, source, last_updated,
        scheme_type, official_source, official_source_url,
        aliases, current_official_name, channel_partner_applicable,
        for_sc, for_st, target_beneficiary,
        state_or_body, state, level, family_income_limit
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40
      )
    `;

    for (const r of dataRows) {
      const id = parseInt(r[0], 10);
      const name = r[1] || '';
      const category = r[2] || '';
      const description = r[3] || null;
      const min_income_lakh = parseNumber(r[4]);
      const max_income_lakh = parseNumber(r[5]);
      const min_loan_lakh = parseNumber(r[6]);
      const max_loan_lakh = parseNumber(r[7]);
      const interest_rate_min = parseNumber(r[8]);
      const interest_rate_max = parseNumber(r[9]);
      const moratorium_months_min = parseIntNumber(r[10]);
      const moratorium_months_max = parseIntNumber(r[11]);
      const max_tenure_months = parseIntNumber(r[12]);
      const coverage_percent = parseNumber(r[13]);
      const eligible_project_types = parseArray(r[14]);
      const education_required = parseBoolean(r[15], false);
      const notes = r[16] || null;
      const active = parseBoolean(r[17], true);
      const short_name = r[18] || null;
      const gender_eligibility = r[19] || 'all';
      const age_min = parseIntNumber(r[20]);
      const age_max = parseIntNumber(r[21]);
      const documents_required = parseArray(r[22]);
      const channel_partner_types = parseArray(r[23]);
      const min_tenure_months = parseIntNumber(r[24]);
      const source = r[25] || 'official';
      const last_updated = parseDate(r[26]);
      const scheme_type = r[27] || 'financing';
      const official_source = r[28] || null;
      const official_source_url = r[29] || null;
      const aliases = parseArray(r[30]);
      const current_official_name = r[31] || null;
      const channel_partner_applicable = parseBoolean(r[32], true);
      const for_sc = r[33] || null;
      const for_st = r[34] || null;
      const target_beneficiary = r[35] || null;
      const state_or_body = r[36] || null;
      const level = r[37] || null;
      const family_income_limit = r[38] || null;

      // Derived state column
      let state = 'Central';
      if (level && level.toLowerCase() === 'state') {
        state = state_or_body || 'State';
      } else if (state_or_body && !state_or_body.toLowerCase().includes('corporation') && !state_or_body.toLowerCase().includes('ministry')) {
        state = state_or_body;
      }

      await client.query(insertQuery, [
        id, name, category, description,
        min_income_lakh, max_income_lakh, min_loan_lakh, max_loan_lakh,
        interest_rate_min, interest_rate_max,
        moratorium_months_min, moratorium_months_max,
        max_tenure_months, coverage_percent,
        eligible_project_types, education_required,
        notes, active, short_name, gender_eligibility,
        age_min, age_max, documents_required, channel_partner_types,
        min_tenure_months, source, last_updated,
        scheme_type, official_source, official_source_url,
        aliases, current_official_name, channel_partner_applicable,
        for_sc, for_st, target_beneficiary,
        state_or_body, state, level, family_income_limit
      ]);
    }

    await client.query('COMMIT');
    console.log('✅ Successfully inserted all 198 schemes into updated_schemes table!');

    // Verification
    const countRes = await client.query('SELECT count(*) FROM updated_schemes;');
    console.log('Total row count in updated_schemes:', countRes.rows[0].count);

    const levelCounts = await client.query('SELECT level, count(*) FROM updated_schemes GROUP BY level ORDER BY count DESC;');
    console.log('Breakdown by Level:', levelCounts.rows);

    const sample = await client.query('SELECT id, name, category, state, level, max_loan_lakh, aliases FROM updated_schemes WHERE id IN (1, 63, 75, 198) ORDER BY id;');
    console.log('Sample rows:', JSON.stringify(sample.rows, null, 2));

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error during upload:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

upload().catch(err => {
  console.error(err);
  process.exit(1);
});
