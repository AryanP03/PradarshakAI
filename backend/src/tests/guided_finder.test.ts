import { recommendSchemes } from '../services/SchemeEngine';

async function runTests() {
  console.log('================== TESTING GUIDED SCHEME FINDER SCENARIOS ==================\n');

  // TEST 1 — BUSINESS (Farmer, Female, 2L loan, 2.5L income)
  console.log('--- TEST 1: BUSINESS (Start a Business, Farmer, Schooling, Female, ₹2L loan, ₹2.5L income) ---');
  const t1 = await recommendSchemes(
    {
      purpose: 'Start a Business - Farmer',
      loan_amount_rs: 200000,
      family_income_rs: 250000,
      education_level: 'school',
      gender: 'female',
    },
    'business_loan',
    6
  );
  console.log(`Results (${t1.length} schemes):`);
  t1.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name} [Tier: ${s.tier}, Score: ${s.score}]`);
    console.log(`     Reasons: ${s.matchReasons.join('; ')}`);
  });
  if (t1.length === 0 || !t1.some((s) => s.tier === 'ELIGIBLE_OPTIMAL')) {
    throw new Error('TEST 1 Failed: Expected optimal business schemes for female farmer');
  }
  console.log('✅ TEST 1 PASSED\n');

  // TEST 2 — EDUCATION (Student, Graduate, ₹2L loan, ₹2.5L income, prefer not to say gender)
  console.log('--- TEST 2: EDUCATION (Higher Education, Student, Graduate, ₹2L loan, ₹2.5L income) ---');
  const t2 = await recommendSchemes(
    {
      purpose: 'Education / Higher Education - Student',
      loan_amount_rs: 200000,
      family_income_rs: 250000,
      education_level: 'undergraduate',
    },
    'education_loan',
    6
  );
  console.log(`Results (${t2.length} schemes):`);
  t2.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name} [Tier: ${s.tier}, Score: ${s.score}]`);
    console.log(`     Reasons: ${s.matchReasons.join('; ')}`);
  });
  if (!t2.some((s) => s.category === 'education_loan')) {
    throw new Error('TEST 2 Failed: Expected education schemes for student');
  }
  console.log('✅ TEST 2 PASSED\n');

  // TEST 3 — STARTUP (Start a Business, Entrepreneur, ₹10L loan, ₹3L income)
  console.log('--- TEST 3: STARTUP (Start a Business, Entrepreneur, ₹10L loan, ₹3L income) ---');
  const t3 = await recommendSchemes(
    {
      purpose: 'Start a Business - Existing Entrepreneur',
      loan_amount_rs: 1000000,
      family_income_rs: 300000,
      education_level: 'undergraduate',
      gender: 'male',
    },
    'business_loan',
    6
  );
  console.log(`Results (${t3.length} schemes):`);
  t3.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name} [Tier: ${s.tier}, Score: ${s.score}]`);
    console.log(`     Reasons: ${s.matchReasons.join('; ')}`);
  });
  if (!t3.some((s) => s.name.includes('Term Loan') || s.name.includes('Stand-Up'))) {
    throw new Error('TEST 3 Failed: Expected Term Loan or Stand-Up India for 10L business venture');
  }
  console.log('✅ TEST 3 PASSED\n');

  // TEST 4 — UNEMPLOYED (Self-Employment, Unemployed, ₹1L loan, ₹1.5L income)
  console.log('--- TEST 4: UNEMPLOYED (Self-Employment, Unemployed status, ₹1L loan, ₹1.5L income) ---');
  const t4 = await recommendSchemes(
    {
      purpose: 'Self-Employment / Micro Enterprise - Unemployed',
      loan_amount_rs: 100000,
      family_income_rs: 150000,
      education_level: 'school',
      gender: 'male',
    },
    'business_loan',
    6
  );
  console.log(`Results (${t4.length} schemes):`);
  t4.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name} [Tier: ${s.tier}, Score: ${s.score}]`);
    console.log(`     Reasons: ${s.matchReasons.join('; ')}`);
  });
  if (t4.length === 0) {
    throw new Error('TEST 4 Failed: Expected micro finance schemes for unemployed individual');
  }
  console.log('✅ TEST 4 PASSED\n');

  // TEST 5 — OTHER (Other Custom Occupation, e.g. "Mobile Repair Shop", ₹1.5L loan)
  console.log('--- TEST 5: OTHER OCCUPATION (Mobile Repair Shop, ₹1.5L loan, ₹2L income) ---');
  const t5 = await recommendSchemes(
    {
      purpose: 'Start a Business - Mobile repair shop',
      loan_amount_rs: 150000,
      family_income_rs: 200000,
      education_level: 'diploma',
      gender: 'male',
    },
    'business_loan',
    6
  );
  console.log(`Results (${t5.length} schemes):`);
  t5.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name} [Tier: ${s.tier}, Score: ${s.score}]`);
  });
  if (t5.length === 0) {
    throw new Error('TEST 5 Failed: Expected schemes for mobile repair shop');
  }
  console.log('✅ TEST 5 PASSED\n');

  // TEST 6 — NO MATCH (Income ₹8.5 Lakhs exceeding universal ₹5L cap)
  console.log('--- TEST 6: NO MATCH (Income ₹8.5L > ₹5.0L universal statutory cap) ---');
  const t6 = await recommendSchemes(
    {
      purpose: 'Start a Business - Retail',
      loan_amount_rs: 200000,
      family_income_rs: 850000,
      education_level: 'undergraduate',
      gender: 'male',
    },
    'business_loan',
    6
  );
  const eligible = t6.filter((s) => s.tier !== 'HARD_DISQUALIFIED');
  console.log(`Eligible Schemes count: ${eligible.length}`);
  console.log(`Disqualification reason: ${t6[0]?.disqualificationReason}`);
  if (eligible.length !== 0 || !t6[0]?.disqualificationReason?.includes('exceeds')) {
    throw new Error('TEST 6 Failed: Expected 0 eligible schemes and statutory disqualification reason');
  }
  console.log('✅ TEST 6 PASSED\n');

  console.log('🎉 ALL 6 GUIDED FINDER FUNCTIONAL SCENARIOS PASSED WITH FULL INTEGRITY!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
});
