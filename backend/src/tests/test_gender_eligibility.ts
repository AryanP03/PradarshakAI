import { pool } from '../db/pool';
import jwt from 'jsonwebtoken';

async function testGender() {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  
  // Create a male user
  const { rows: maleRows } = await pool.query(
    `INSERT INTO users (name, phone, email, password_hash, gender, salary) VALUES ('Test Male', '9999999991', 'male_${Date.now()}@test.com', 'dummy', 'male', '90000') RETURNING id`
  );
  const maleToken = jwt.sign({ userId: maleRows[0].id }, secret);

  // Create a female user
  const { rows: femaleRows } = await pool.query(
    `INSERT INTO users (name, phone, email, password_hash, gender, salary) VALUES ('Test Female', '9999999992', 'female_${Date.now()}@test.com', 'dummy', 'female', '90000') RETURNING id`
  );
  const femaleToken = jwt.sign({ userId: femaleRows[0].id }, secret);

  const query = "I want to open my own agriculture farm, my income is below 1 lakh";

  console.log('=== TEST 1: MALE USER ===');
  const resMale = await fetch('http://localhost:4000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${maleToken}` },
    body: JSON.stringify({ message: query })
  });
  const dataMale = await resMale.json();
  const schemesMale = dataMale.data?.schemes || dataMale.schemes || [];
  
  console.log(`Returned ${schemesMale.length} schemes.`);
  schemesMale.slice(0, 5).forEach((s: any) => {
    console.log(`- [ID ${s.id}] ${s.name} | Tier: ${s.tier} | Match: ${s.matchPercentage}%`);
    if (s.id === 3 || s.id === 5 || s.id === 40 || s.id === 1) {
      console.log(`  -> Included! ${s.matchReasons?.join(', ')}`);
    }
  });
  if (!schemesMale.find((s: any) => s.id === 3)) {
    console.log('- [ID 3] Mahila Adhikarita Yojana (MAY) was EXCLUDED as expected.');
    
    // Check disqualification reason directly from engine
    const { pool: dbPool } = require('../db/pool');
    const { scoreSchemes } = require('../services/SchemeEngine');
    const { rows: allSchemes } = await dbPool.query('SELECT * FROM schemes WHERE active = true');
    const scored = scoreSchemes(allSchemes, { gender: 'male', family_income_rs: 90000, purpose: 'agriculture farm' }, 'business_loan');
    const mayScheme = scored.find((s: any) => s.id === 3);
    if (mayScheme) {
      console.log(`  -> ENGINE DISQUALIFICATION REASON: ${mayScheme.disqualificationReason}`);
    }
    
    // Also print the ones that WERE returned by engine
    console.log(`\nEngine scored ${scored.length} schemes.`);
    scored.slice(0, 5).forEach((s: any) => {
      console.log(`- [ID ${s.id}] ${s.name} | Tier: ${s.tier} | Match: ${s.score}%`);
    });
  }

  console.log('\n=== TEST 2: FEMALE USER ===');
  const resFemale = await fetch('http://localhost:4000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${femaleToken}` },
    body: JSON.stringify({ message: query })
  });
  const dataFemale = await resFemale.json();
  const schemesFemale = dataFemale.data?.schemes || dataFemale.schemes || [];
  
  console.log(`Returned ${schemesFemale.length} schemes.`);
  schemesFemale.slice(0, 5).forEach((s: any) => {
    console.log(`- [ID ${s.id}] ${s.name} | Tier: ${s.tier} | Match: ${s.matchPercentage}%`);
    if (s.id === 3) {
      console.log(`  -> Included! ${s.matchReasons?.join(', ')}`);
    }
  });

  // Cleanup
  await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [maleRows[0].id, femaleRows[0].id]);
  process.exit(0);
}

testGender().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
