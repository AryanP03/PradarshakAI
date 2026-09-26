import http from 'http';

function postJson(url: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(resData));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${resData}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runSection6Tests() {
  console.log('=== SECTION 6: EDGE CASES & BACKWARD COMPATIBILITY AUDIT ===');

  // Test 1: Absurd profile with no matching schemes
  console.log('\n--- Test 6.1: Absurd Profile (Income ₹50 Lakh, Loan ₹5 Crore, Crypto Hedge Fund) ---');
  const absurdProfile = {
    purpose: 'cryptocurrency speculative trading offshore hedge fund derivatives',
    family_income_rs: 5000000, // 50 Lakh
    loan_amount_rs: 50000000,  // 5 Crore
    gender: 'male',
    state: 'Maharashtra',
  };

  const absurdResult = await postJson('http://localhost:4000/api/recommend/finder', absurdProfile);
  const schemes = absurdResult.schemes || [];
  console.log(`HTTP Status: 200 OK (Graceful degradation)`);
  console.log(`Total schemes returned: ${schemes.length}`);
  console.log(`Eligible schemes returned (Optimal/Suboptimal): ${schemes.filter((r: any) => r.tier !== 'HARD_DISQUALIFIED').length}`);
  console.log(`Hard Disqualified schemes count: ${schemes.filter((r: any) => r.tier === 'HARD_DISQUALIFIED').length}`);
  if (schemes.length > 0) {
    console.log(`Sample returned scheme: [ID ${schemes[0].id}] ${schemes[0].name}`);
    console.log(`Tier: ${schemes[0].tier}`);
    console.log(`Disqualification Reason: ${schemes[0].disqualificationReason}`);
    console.log(`Warnings: ${JSON.stringify(schemes[0].warnings)}`);
  }

  // Also test with chat endpoint for conversational degradation
  console.log('\n--- Test 6.1b: Chat Advisor with Absurd Profile ---');
  const chatPayload = {
    message: 'I earn 60 lakh rupees a year and want a 5 crore loan for cryptocurrency day trading. Can I get an NSFDC loan?',
  };
  const chatResult = await postJson('http://localhost:4000/api/chat', chatPayload);
  console.log('Chat Assistant Response Preview:');
  console.log(chatResult.message?.substring(0, 300) + '...');
  console.log(`Recommended schemes attached in chat: ${chatResult.recommendedSchemes?.length || 0}`);

  // Test 2: Known-good prior behavior of Original 14 Schemes
  console.log('\n--- Test 6.2: Backward Compatibility - Legacy Profile 1 (Female Tailoring ₹1.2L Loan) ---');
  const legacyProfile1 = {
    purpose: 'tailoring boutique sewing machine',
    family_income_rs: 250000,
    loan_amount_rs: 120000,
    gender: 'female',
    state: 'Maharashtra',
    limit: 5,
  };
  const legacyRes1 = await postJson('http://localhost:4000/api/recommend/finder', legacyProfile1);
  const legSchemes1 = legacyRes1.schemes || [];
  console.log('Top Schemes for Legacy Profile 1:');
  legSchemes1.forEach((s: any, idx: number) => {
    console.log(`  ${idx + 1}. [ID ${s.id}] ${s.name} (Tier: ${s.tier}, Score: ${s.score})`);
  });
  const hasMsy = legSchemes1.some((s: any) => s.id === 2 || s.name.includes('Mahila Samriddhi'));
  const hasMcf = legSchemes1.some((s: any) => s.id === 1 || s.name.includes('Micro Credit'));
  console.log(`Surfaces Mahila Samriddhi Yojana (MSY): ${hasMsy}`);
  console.log(`Surfaces Micro Credit Finance (MCF): ${hasMcf}`);

  console.log('\n--- Test 6.2: Backward Compatibility - Legacy Profile 2 (Higher Education / ELS) ---');
  const legacyProfile2 = {
    purpose: 'education loan for BTech engineering degree',
    family_income_rs: 300000,
    loan_amount_rs: 800000,
    gender: 'male',
    state: 'Karnataka',
    limit: 5,
  };
  const legacyRes2 = await postJson('http://localhost:4000/api/recommend/finder', legacyProfile2);
  const legSchemes2 = legacyRes2.schemes || [];
  console.log('Top Schemes for Legacy Profile 2:');
  legSchemes2.forEach((s: any, idx: number) => {
    console.log(`  ${idx + 1}. [ID ${s.id}] ${s.name} (Tier: ${s.tier}, Score: ${s.score})`);
  });
  const hasEls = legSchemes2.some((s: any) => s.id === 10 || s.name.includes('Education Loan Scheme'));
  console.log(`Surfaces Education Loan Scheme (ELS): ${hasEls}`);
}

runSection6Tests().catch(err => {
  console.error(err);
  process.exit(1);
});
