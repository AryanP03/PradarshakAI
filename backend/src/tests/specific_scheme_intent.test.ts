import assert from 'assert';
import { fetchActiveSchemes, identifySpecificScheme } from '../services/SchemeEngine';
import { executeTool } from '../services/Tools';
import { process as orchestrate } from '../services/ChatOrchestrator';
import { getOrCreate } from '../services/ConversationSession';

let passed = 0;
let failed = 0;

function it(desc: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    })
    .catch((err) => {
      console.error(`  ❌ FAIL: ${desc}`);
      console.error(err);
      failed++;
    });
}

async function runTests() {
  console.log('\n🔍 ========================================================');
  console.log('   PRADARSHAKAI: SPECIFIC SCHEME INTENT ROUTING TEST SUITE');
  console.log('========================================================\n');

  const allSchemes = await fetchActiveSchemes();

  // ── 1. Unit Tests for identifySpecificScheme ──────────────────────────────────
  console.log('📋 1. Testing Scheme Identification & Intent Disambiguation:');

  await it('TEST 1.1: Direct named query "Tell me about the Mahila Samriddhi Yojana (MSY) scheme"', () => {
    const res = identifySpecificScheme('Tell me about the Mahila Samriddhi Yojana (MSY) scheme', allSchemes);
    assert.strictEqual(res.isSpecificSchemeQuery, true);
    assert.strictEqual(res.isAlternativeOrCompare, false);
    assert.ok(res.scheme);
    assert.strictEqual(res.scheme?.id, 2); // MSY
    assert.strictEqual(res.scheme?.name, 'Mahila Samriddhi Yojana (MSY)');
  });

  await it('TEST 1.2: Acronym query "What is MSY?"', () => {
    const res = identifySpecificScheme('What is MSY?', allSchemes);
    assert.strictEqual(res.isSpecificSchemeQuery, true);
    assert.strictEqual(res.scheme?.id, 2);
  });

  await it('TEST 1.3: Specific attribute query "What is the interest rate of MSY?"', () => {
    const res = identifySpecificScheme('What is the interest rate of MSY?', allSchemes);
    assert.strictEqual(res.isSpecificSchemeQuery, true);
    assert.strictEqual(res.scheme?.id, 2);
    assert.strictEqual(res.queryFocus, 'interest_rate');
  });

  await it('TEST 1.4: Eligibility query "Who is eligible for Mahila Samriddhi Yojana?"', () => {
    const res = identifySpecificScheme('Who is eligible for Mahila Samriddhi Yojana?', allSchemes);
    assert.strictEqual(res.isSpecificSchemeQuery, true);
    assert.strictEqual(res.scheme?.id, 2);
    assert.strictEqual(res.queryFocus, 'eligibility');
  });

  await it('TEST 1.5: Broad recommendation query "Which scheme is best for me for a small business?" should NOT be specific scheme', () => {
    const res = identifySpecificScheme('Which scheme is best for me for a small business?', allSchemes);
    assert.strictEqual(res.isSpecificSchemeQuery, false);
    assert.strictEqual(res.scheme, null);
  });

  await it('TEST 1.6: Demographic query "What loan schemes are available for women?" should NOT be specific scheme', () => {
    const res = identifySpecificScheme('What loan schemes are available for women?', allSchemes);
    assert.strictEqual(res.isSpecificSchemeQuery, false);
  });

  await it('TEST 1.7: Alternative query "Tell me about MSY. What other schemes are similar?" flags alternative/comparison', () => {
    const res = identifySpecificScheme('Tell me about MSY. What other schemes are similar?', allSchemes);
    assert.strictEqual(res.isAlternativeOrCompare, true);
    assert.strictEqual(res.isSpecificSchemeQuery, false);
  });

  await it('TEST 1.8: Follow-up query "What is the interest rate?" with MSY as selected scheme', () => {
    const res = identifySpecificScheme('What is the interest rate?', allSchemes, { id: 2, name: 'Mahila Samriddhi Yojana (MSY)' });
    assert.strictEqual(res.isSpecificSchemeQuery, true);
    assert.strictEqual(res.scheme?.id, 2);
    assert.strictEqual(res.queryFocus, 'interest_rate');
  });

  await it('TEST 1.9: Multi-turn switch "Which scheme is better for me?" clears specific scheme query', () => {
    const res = identifySpecificScheme('Which scheme is better for me?', allSchemes, { id: 2, name: 'Mahila Samriddhi Yojana (MSY)' });
    assert.strictEqual(res.isAlternativeOrCompare, true);
    assert.strictEqual(res.isSpecificSchemeQuery, false);
  });

  // ── 2. Multilingual Scheme Identification ─────────────────────────────────────
  console.log('\n🌐 2. Testing Multilingual Scheme Identification:');

  await it('TEST 2.1: Hindi "महिला समृद्धि योजना के बारे में बताइए।"', () => {
    const res = identifySpecificScheme('महिला समृद्धि योजना के बारे में बताइए।', allSchemes);
    assert.strictEqual(res.isSpecificSchemeQuery, true);
    assert.strictEqual(res.scheme?.id, 2);
  });

  await it('TEST 2.2: Marathi "महिला समृद्धी योजनेबद्दल माहिती द्या."', () => {
    const res = identifySpecificScheme('महिला समृद्धी योजनेबद्दल माहिती द्या.', allSchemes);
    assert.strictEqual(res.isSpecificSchemeQuery, true);
    assert.strictEqual(res.scheme?.id, 2);
  });

  await it('TEST 2.3: Gujarati "મહિલા સમૃદ્ધિ યોજના વિશે જણાવો."', () => {
    const res = identifySpecificScheme('મહિલા સમૃદ્ધિ યોજના વિશે જણાવો.', allSchemes);
    assert.strictEqual(res.isSpecificSchemeQuery, true);
    assert.strictEqual(res.scheme?.id, 2);
  });

  await it('TEST 2.4: Hindi attribute query "महिला समृद्धि योजना की ब्याज दर क्या है?"', () => {
    const res = identifySpecificScheme('महिला समृद्धि योजना की ब्याज दर क्या है?', allSchemes);
    assert.strictEqual(res.isSpecificSchemeQuery, true);
    assert.strictEqual(res.scheme?.id, 2);
    assert.strictEqual(res.queryFocus, 'interest_rate');
  });

  // ── 3. Tool Execution Tests ───────────────────────────────────────────────────
  console.log('\n🛠️ 3. Testing Tool Execution & Output Structure:');

  await it('TEST 3.1: get_scheme_details returns exactly ONE scheme', async () => {
    const result = await executeTool('get_scheme_details', { scheme_name: 'MSY' });
    assert.strictEqual(result.toolName, 'get_scheme_details');
    assert.ok(result.data.scheme);
    assert.ok(Array.isArray(result.data.schemes));
    assert.strictEqual((result.data.schemes as any[]).length, 1);
    assert.strictEqual((result.data.schemes as any[])[0].id, 2);
    assert.strictEqual((result.data.schemes as any[])[0].name, 'Mahila Samriddhi Yojana (MSY)');
  });

  await it('TEST 3.2: recommend_schemes for general tailoring business returns top 3 schemes', async () => {
    const result = await executeTool('recommend_schemes', { purpose: 'tailoring', loan_amount_rs: 100000 });
    assert.strictEqual(result.toolName, 'recommend_schemes');
    assert.ok(Array.isArray(result.data.schemes));
    assert.strictEqual((result.data.schemes as any[]).length, 3);
  });

  await it('TEST 3.3: compare_schemes returns 2 schemes', async () => {
    const result = await executeTool('compare_schemes', { scheme_names: ['MSY', 'MAY'] });
    assert.strictEqual(result.toolName, 'compare_schemes');
    assert.ok(Array.isArray(result.data.schemes));
    assert.strictEqual((result.data.schemes as any[]).length, 2);
  });

  // ── 4. End-to-End Orchestrator Intent & Response Mode Tests ───────────────────
  console.log('\n🤖 4. Testing End-to-End Chat Orchestrator Behavior:');

  await it('TEST 4.1: Direct named scheme query returns intent="specific_scheme_query" and exactly 1 scheme', async () => {
    const session = getOrCreate('test-session-msy-direct');
    const response = await orchestrate(
      'Tell me about the Mahila Samriddhi Yojana (MSY) scheme',
      session.id,
      'en'
    );

    assert.strictEqual(response.intent, 'specific_scheme_query');
    assert.strictEqual(response.type, 'schemes');
    assert.ok(response.data);
    const returnedSchemes = (response.data.schemes as any[]) || [];
    assert.strictEqual(returnedSchemes.length, 1);
    assert.strictEqual(returnedSchemes[0].id, 2);
    assert.strictEqual(returnedSchemes[0].name, 'Mahila Samriddhi Yojana (MSY)');
    // Unrelated schemes must NOT appear
    assert.strictEqual(returnedSchemes.some((s) => s.name.includes('Adhikarita')), false);
    assert.strictEqual(returnedSchemes.some((s) => s.name.includes('DAKSH')), false);
  });

  await it('TEST 4.2: Open-ended recommendation query returns intent="scheme_recommendation" and multiple schemes', async () => {
    const session = getOrCreate('test-session-broad-discovery');
    const response = await orchestrate(
      'Which scheme is best for me for a small tailoring business?',
      session.id,
      'en'
    );

    assert.strictEqual(response.intent, 'scheme_recommendation');
    assert.strictEqual(response.type, 'schemes');
    const returnedSchemes = (response.data?.schemes as any[]) || [];
    assert.ok(returnedSchemes.length >= 2);
  });

  await it('TEST 4.3: Follow-up question preserves scheme context and returns single scheme', async () => {
    const sessionId = `test-followup-${Date.now()}`;
    // Turn 1: Ask about MSY
    const turn1 = await orchestrate(
      'Tell me about Mahila Samriddhi Yojana.',
      sessionId,
      'en'
    );
    assert.strictEqual(turn1.intent, 'specific_scheme_query');
    assert.strictEqual(((turn1.data?.schemes as any[]) || []).length, 1);

    // Turn 2: Ask about interest rate without mentioning MSY by name
    const turn2 = await orchestrate(
      'What is its interest rate?',
      sessionId,
      'en'
    );
    assert.strictEqual(turn2.intent, 'specific_scheme_query');
    const t2Schemes = (turn2.data?.schemes as any[]) || [];
    assert.strictEqual(t2Schemes.length, 1);
    assert.strictEqual(t2Schemes[0].id, 2);
  });

  await it('TEST 4.4: Asking for alternatives after discussing MSY switches to recommendation flow', async () => {
    const sessionId = `test-switch-${Date.now()}`;
    // Turn 1: Ask about MSY
    await orchestrate(
      'Tell me about Mahila Samriddhi Yojana.',
      sessionId,
      'en'
    );

    // Turn 2: Ask for other schemes / alternatives
    const turn2 = await orchestrate(
      'What other schemes are available for me?',
      sessionId,
      'en'
    );
    assert.strictEqual(turn2.intent, 'scheme_recommendation');
    const t2Schemes = (turn2.data?.schemes as any[]) || [];
    assert.ok(t2Schemes.length >= 2);
  });

  console.log(`\n========================================================`);
  console.log(`🏁 SPECIFIC SCHEME INTENT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
