import { recommendSchemes } from '../services/SchemeEngine';
import type { UserEntities } from '../services/ConversationSession';

async function runTests() {
  const profiles: { name: string; entities: UserEntities; categoryHint?: string }[] = [
    {
      name: 'Profile 1: Gujarat Male - Passenger Auto Rickshaw loan (₹1.5L, ₹2.5L income)',
      entities: {
        purpose: 'auto rickshaw transport passenger vehicle',
        loan_amount_rs: 150000,
        family_income_rs: 250000,
        gender: 'male',
        location: 'Ahmedabad, Gujarat',
        state: 'Gujarat',
      },
      categoryHint: 'business_loan',
    },
    {
      name: 'Profile 2: Maharashtra Female - Tailoring & Boutique micro enterprise (₹1.2L, ₹2.8L income)',
      entities: {
        purpose: 'tailoring shop and boutique sewing machine',
        loan_amount_rs: 120000,
        family_income_rs: 280000,
        gender: 'female',
        location: 'Pune, Maharashtra',
        state: 'Maharashtra',
      },
      categoryHint: 'business_loan',
    },
    {
      name: 'Profile 3: Karnataka Student - B.Tech Higher Education Course (₹8L, ₹4L income)',
      entities: {
        purpose: 'B.Tech Engineering college tuition fees and hostel',
        course: 'B.Tech Engineering',
        education_level: 'undergraduate',
        loan_amount_rs: 800000,
        family_income_rs: 400000,
        location: 'Bengaluru, Karnataka',
        state: 'Karnataka',
      },
      categoryHint: 'education_loan',
    },
    {
      name: 'Profile 4: Madhya Pradesh Farmer - Dairy & Cattle Livestock (₹3L, ₹2.5L income)',
      entities: {
        purpose: 'dairy farming and cattle buffalo rearing',
        loan_amount_rs: 300000,
        family_income_rs: 250000,
        gender: 'male',
        location: 'Indore, Madhya Pradesh',
        state: 'Madhya Pradesh',
      },
      categoryHint: 'business_loan',
    },
    {
      name: 'Profile 5: Delhi Beneficiary - Mechanized Cleaning & Sanitation Enterprise (₹10L, ₹2.5L income)',
      entities: {
        purpose: 'sanitation enterprise waste cleaning suction machinery',
        loan_amount_rs: 1000000,
        family_income_rs: 250000,
        location: 'New Delhi',
        state: 'Delhi',
      },
      categoryHint: 'business_loan',
    },
  ];

  console.log('================================================================');
  console.log('RECOMMENDER TOP-3 TEST ACROSS 5 REALISTIC DIVERSE USER PROFILES');
  console.log('================================================================\n');

  for (const p of profiles) {
    console.log(`\n▶ TESTING ${p.name}`);
    console.log(`  Inputs: State=${p.entities.state}, Gender=${p.entities.gender || 'any'}, Purpose="${p.entities.purpose}", Loan=₹${(p.entities.loan_amount_rs!/100000).toFixed(1)}L, Income=₹${(p.entities.family_income_rs!/100000).toFixed(1)}L`);

    const results = await recommendSchemes(p.entities, p.categoryHint, 3);

    console.log(`  Returned ${results.length} schemes:`);
    results.forEach((s, idx) => {
      console.log(`    ${idx + 1}. [ID ${s.id}] ${s.name}`);
      console.log(`       Category: ${s.category} | State: ${s.state} | Level: ${s.level}`);
      console.log(`       Score: ${s.score} | Tier: ${s.tier}`);
      console.log(`       Interest: ${s.interest_rate_min}%–${s.interest_rate_max}% | Max Loan: ₹${s.max_loan_lakh}L`);
      console.log(`       Match Reasons: ${s.matchReasons.join('; ')}`);
      if (s.warnings.length > 0) console.log(`       Warnings: ${s.warnings.join('; ')}`);
    });
  }

  process.exit(0);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
