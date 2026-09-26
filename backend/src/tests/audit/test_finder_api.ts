async function runFinderTests() {
  const testProfiles = [
    {
      id: 'Profile A',
      desc: 'A woman in Maharashtra, income ₹2 lakh, wants a small loan for a tailoring business',
      payload: {
        purpose: 'tailoring business small loan sewing machine',
        gender: 'female',
        state: 'Maharashtra',
        location: 'Maharashtra',
        family_income_rs: 200000,
        category_hint: 'business_loan',
        limit: 3,
      },
    },
    {
      id: 'Profile B',
      desc: 'A man in Gujarat, income ₹4 lakh, wants to buy an auto-rickshaw for self-employment',
      payload: {
        purpose: 'buy auto-rickshaw passenger transport vehicle for self-employment',
        gender: 'male',
        state: 'Gujarat',
        location: 'Gujarat',
        family_income_rs: 400000,
        category_hint: 'business_loan',
        limit: 3,
      },
    },
    {
      id: 'Profile C',
      desc: 'A student in Bihar, family income ₹2 lakh, needs a post-matric scholarship',
      payload: {
        purpose: 'post-matric scholarship for education',
        state: 'Bihar',
        location: 'Bihar',
        family_income_rs: 200000,
        education_level: 'undergraduate',
        category_hint: 'education_loan',
        limit: 3,
      },
    },
    {
      id: 'Profile D',
      desc: 'A user with no state specified, income ₹6 lakh, wants a business loan',
      payload: {
        purpose: 'business loan enterprise working capital',
        family_income_rs: 600000,
        category_hint: 'business_loan',
        limit: 3,
      },
    },
    {
      id: 'Profile E',
      desc: 'A user in Kerala, income ₹1 lakh, looking for any welfare/medical assistance scheme',
      payload: {
        purpose: 'welfare medical assistance health financial aid',
        state: 'Kerala',
        location: 'Kerala',
        family_income_rs: 100000,
        category_hint: 'welfare',
        limit: 3,
      },
    },
  ];

  console.log('================================================================');
  console.log('AUDIT SECTION 2: CORE RECOMMENDATION CORRECTNESS VIA LIVE API');
  console.log('Target: POST http://localhost:4000/api/recommend/finder');
  console.log('================================================================\n');

  for (const p of testProfiles) {
    console.log(`----------------------------------------------------------------`);
    console.log(`▶ ${p.id}: ${p.desc}`);
    console.log(`Payload: ${JSON.stringify(p.payload)}`);
    console.log(`----------------------------------------------------------------`);

    const t0 = Date.now();
    const res = await fetch('http://localhost:4000/api/recommend/finder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p.payload),
    });
    const duration = Date.now() - t0;

    if (!res.ok) {
      console.error(`HTTP ERROR ${res.status}:`, await res.text());
      continue;
    }

    const data: any = await res.json();
    const schemes = data.schemes || [];
    console.log(`HTTP 200 in ${duration}ms | Schemes returned: ${schemes.length}`);

    schemes.forEach((s: any, idx: number) => {
      console.log(`  ${idx + 1}. [ID ${s.id}] ${s.name}`);
      console.log(`     Category: ${s.category} | State: ${s.state} | Level: ${s.level}`);
      console.log(`     Score: ${s.score} | Tier: ${s.tier}`);
      console.log(`     Max Loan: ₹${s.max_loan_lakh ?? 'N/A'}L | Interest: ${s.interest_rate_min}%–${s.interest_rate_max}%`);
      console.log(`     Income Ceiling: ₹${s.max_income_lakh ?? 'No ceiling'}L | Family Income Limit: ${s.family_income_limit || 'None'}`);
      console.log(`     Match Reasons: ${s.matchReasons?.join('; ')}`);
      if (s.warnings?.length) console.log(`     Warnings: ${s.warnings.join('; ')}`);
    });
    console.log('');
  }
}

runFinderTests().catch(console.error);
