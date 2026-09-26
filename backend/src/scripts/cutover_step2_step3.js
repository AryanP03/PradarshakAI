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

function cleanText(text) {
  if (!text) return text;
  let str = text;

  // Specific phrases
  str = str.replace(/\?10K \? \?20K \? \?50K/g, '₹10K → ₹20K → ₹50K');
  str = str.replace(/income \? \?15,000/g, 'income ≤ ₹15,000');
  str = str.replace(/income \? \?1\.2 lakh/g, 'income ≤ ₹1.2 lakh');
  str = str.replace(/\? ?2 ha/g, '≤ 2 ha');

  // Double question mark before numbers (meaning <= ₹)
  str = str.replace(/\?\?([0-9])/g, '≤ ₹$1');

  // Rupee range e.g. ?1,000?5,000 or ?200?500
  str = str.replace(/\?([0-9,]+)\s*[\?]\s*\?([0-9,]+)/g, '₹$1–₹$2');

  // Percentage range e.g. 4?6% or 1.5?2%
  str = str.replace(/([0-9.]+)\s*[\?]\s*([0-9.]+)%/g, '$1–$2%');

  // Classes range e.g. Classes XI?PhD, Classes IX?X
  str = str.replace(/Classes ([IVXLCDM]+)\s*[\?]\s*([a-zA-Z0-9]+)/g, 'Classes $1–$2');

  // General range between numbers e.g. 18?40
  str = str.replace(/([0-9]+)\s*[\?]\s*([0-9]+)/g, '$1–$2');

  // Decimal range e.g. 1.5?2.5
  str = str.replace(/([0-9]+\.[0-9]+)\s*[\?]\s*([0-9]+\.[0-9]+)/g, '$1–$2');

  // Single ? followed by digit e.g. ?1.40 or ?50 or ?3
  str = str.replace(/\?([0-9])/g, '₹$1');

  // In quotes or brackets or separators
  str = str.replace(/–\s*\?/g, '– ₹');
  str = str.replace(/\s*[]\s*/g, ' – ');

  return str;
}

function parseNumber(val) {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (str === '') return null;
  const cleaned = str.replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

function parseIntNumber(val) {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  if (str === '') return null;
  const cleaned = str.replace(/[^0-9.-]/g, '');
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
      if (Array.isArray(parsed)) return parsed.map(s => cleanText(String(s).trim()));
    } catch {
      // fallback
    }
  }
  return trimmed.split(',').map(s => cleanText(s.trim().replace(/^["']|["']$/g, ''))).filter(Boolean);
}

function parseDate(val) {
  if (!val || val.trim() === '') return null;
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return null;
}

async function runCutover() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const csvPath = path.join(__dirname, '../db/updated_schemes.csv');
    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(content);
    const dataRows = rows.slice(1);

    console.log(`Parsed ${dataRows.length} scheme rows from CSV.`);

    await client.query('BEGIN');

    // Step 2 & 3: Backup schemes table if not already backed up
    console.log('Backing up old schemes table to schemes_backup_14...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schemes_backup_14 AS 
      SELECT * FROM schemes;
    `);

    const backupCount = await client.query('SELECT count(*) FROM schemes_backup_14;');
    console.log(`schemes_backup_14 row count: ${backupCount.rows[0].count}`);

    // Recreate updated_schemes table with exact types
    console.log('Recreating updated_schemes with typed columns (TEXT[], BOOLEAN, NULL numbers)...');
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
        eligible_project_types TEXT[] NOT NULL DEFAULT '{}',
        education_required BOOLEAN NOT NULL DEFAULT FALSE,
        notes TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        short_name TEXT,
        gender_eligibility TEXT DEFAULT 'all',
        age_min INT,
        age_max INT,
        documents_required TEXT[] DEFAULT '{}',
        channel_partner_types TEXT[] DEFAULT '{}',
        min_tenure_months INT,
        source TEXT DEFAULT 'official',
        last_updated DATE DEFAULT CURRENT_DATE,
        scheme_type TEXT DEFAULT 'financing',
        official_source TEXT,
        official_source_url TEXT,
        aliases TEXT[] DEFAULT '{}',
        current_official_name TEXT,
        channel_partner_applicable BOOLEAN NOT NULL DEFAULT TRUE,
        for_sc BOOLEAN NOT NULL DEFAULT TRUE,
        for_st BOOLEAN NOT NULL DEFAULT FALSE,
        target_beneficiary TEXT,
        state_or_body TEXT,
        state TEXT NOT NULL,
        level TEXT NOT NULL,
        family_income_limit TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_updated_schemes_category ON updated_schemes(category);
      CREATE INDEX IF NOT EXISTS idx_updated_schemes_active ON updated_schemes(active);
      CREATE INDEX IF NOT EXISTS idx_updated_schemes_state ON updated_schemes(state);
      CREATE INDEX IF NOT EXISTS idx_updated_schemes_level ON updated_schemes(level);
    `);

    const insertSql = `
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
      const name = cleanText(r[1]) || '';
      const category = (r[2] || '').trim();
      const description = cleanText(r[3]) || null;
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
      const notes = cleanText(r[16]) || null;
      const active = parseBoolean(r[17], true);
      const short_name = cleanText(r[18]) || null;
      const gender_eligibility = (r[19] || 'all').trim();
      const age_min = parseIntNumber(r[20]);
      const age_max = parseIntNumber(r[21]);
      const documents_required = parseArray(r[22]);
      const channel_partner_types = parseArray(r[23]);
      const min_tenure_months = parseIntNumber(r[24]);
      const source = (r[25] || 'official').trim();
      const last_updated = parseDate(r[26]);
      const scheme_type = (r[27] || 'financing').trim();
      const official_source = cleanText(r[28]) || null;
      const official_source_url = (r[29] || '').trim() || null;
      const aliases = parseArray(r[30]);
      const current_official_name = cleanText(r[31]) || null;
      const channel_partner_applicable = parseBoolean(r[32], true);
      const for_sc = parseBoolean(r[33], true);
      const for_st = parseBoolean(r[34], false);
      const target_beneficiary = cleanText(r[35]) || null;
      const state_or_body = cleanText(r[36]) || null;
      const level = (r[37] || 'Central').trim();
      const family_income_limit = cleanText(r[38]) || null;

      let state = 'Central';
      if (level.toLowerCase() === 'state') {
        state = state_or_body || 'State';
      }

      await client.query(insertSql, [
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

    // Now copy all 198 rows into schemes so that ALL existing app queries seamlessly use the 198 schemes!
    console.log('Synchronizing schemes table with updated_schemes (198 rows)...');
    await client.query('DROP TABLE IF EXISTS schemes CASCADE;');
    await client.query('CREATE TABLE schemes (LIKE updated_schemes INCLUDING ALL);');
    await client.query('INSERT INTO schemes SELECT * FROM updated_schemes;');

    await client.query('COMMIT');
    console.log('✅ Cutover and sync complete!');

    // Verification queries
    const schemesCount = await client.query('SELECT count(*) FROM schemes;');
    const updatedCount = await client.query('SELECT count(*) FROM updated_schemes;');
    console.log(`schemes row count: ${schemesCount.rows[0].count}`);
    console.log(`updated_schemes row count: ${updatedCount.rows[0].count}`);

    // Verify ? characters in text
    const qCheck = await client.query(`
      SELECT count(*) FROM schemes 
      WHERE description LIKE '%?%' OR notes LIKE '%?%' OR family_income_limit LIKE '%?%';
    `);
    console.log(`Rows with '?' in schemes: ${qCheck.rows[0].count}`);

    // Verify ₹ presence
    const rupeeCheck = await client.query(`
      SELECT count(*) FROM schemes 
      WHERE description LIKE '%₹%' OR notes LIKE '%₹%' OR family_income_limit LIKE '%₹%';
    `);
    console.log(`Rows with '₹' in schemes: ${rupeeCheck.rows[0].count}`);

    // Check array types in pg driver
    const arrayCheck = await client.query(`
      SELECT id, name, eligible_project_types, aliases, for_sc, for_st, state
      FROM schemes WHERE id IN (1, 63, 75) ORDER BY id;
    `);
    console.log('Array and boolean type check:');
    arrayCheck.rows.forEach(r => {
      console.log(`ID ${r.id}: ${r.name}`);
      console.log(`  eligible_project_types isArray: ${Array.isArray(r.eligible_project_types)}, length: ${r.eligible_project_types.length}`);
      console.log(`  aliases isArray: ${Array.isArray(r.aliases)}, length: ${r.aliases.length}`);
      console.log(`  for_sc: ${typeof r.for_sc} (${r.for_sc}), for_st: ${typeof r.for_st} (${r.for_st})`);
      console.log(`  state: ${r.state}`);
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error during cutover:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runCutover().catch(err => {
  console.error(err);
  process.exit(1);
});
