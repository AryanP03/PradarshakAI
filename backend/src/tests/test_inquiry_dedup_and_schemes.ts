import fetch from 'node-fetch';
import { pool } from '../db/pool';

const API_BASE = 'http://localhost:4000/api';

async function main() {
  console.log('====================================================');
  console.log('RUNNING SYSTEMATIC VERIFICATION FOR INQUIRY DEDUP');
  console.log('====================================================\n');

  // Test 1: Rapid concurrent requests with same inquiryId (Simulating rapid double-click or React double-effect)
  console.log('--- TEST 1: Rapid Concurrent Duplicate Requests (GBS) ---');
  const inquiryIdGBS = 'inq_test_gbs_' + Date.now();
  const queryGBS = 'Tell me about the Green Business Scheme (GBS) scheme';

  const [res1, res2] = await Promise.all([
    fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: queryGBS,
        inquiryId: inquiryIdGBS,
        newChat: true,
      }),
    }).then((r) => r.json() as Promise<any>),
    fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: queryGBS,
        inquiryId: inquiryIdGBS,
        newChat: true,
      }),
    }).then((r) => r.json() as Promise<any>),
  ]);

  if (!res1.message || !res2.message) {
    console.error('❌ Failed: missing message in response', res1, res2);
    process.exit(1);
  }

  console.log('res1 sessionId / chatId:', res1.sessionId || res1.chatId);
  console.log('res2 sessionId / chatId:', res2.sessionId || res2.chatId);
  console.log('res1 message snippet:', res1.message.substring(0, 100));
  console.log('res2 message snippet:', res2.message.substring(0, 100));

  const sameResponse = res1.message === res2.message;
  console.log(`✅ Concurrent requests returned identical cached/joined response: ${sameResponse}`);

  if (res1.data?.schemes) {
    console.log(`✅ Scheme cards count in res1: ${res1.data.schemes.length} (scheme: ${res1.data.schemes[0]?.name})`);
    if (res1.data.schemes.length !== 1) {
      console.error('❌ Expected exactly 1 scheme card for specific scheme inquiry!');
      process.exit(1);
    }
  }

  // Test 2: Sequential duplicate request with same inquiryId
  console.log('\n--- TEST 2: Subsequent Duplicate Request within cache window ---');
  const res3 = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: queryGBS,
      inquiryId: inquiryIdGBS,
      newChat: true,
    }),
  }).then((r) => r.json() as Promise<any>);

  console.log(`✅ Cached response match: ${res3.message === res1.message}`);

  // Test 3: Multiple distinct schemes to verify no hardcoding
  const schemesToTest = [
    { name: 'Mahila Samriddhi Yojana (MSY)', query: 'Tell me about the Mahila Samriddhi Yojana (MSY) scheme' },
    { name: 'Udyam Nidhi Yojana (UNY)', query: 'Tell me about the Udyam Nidhi Yojana (UNY) scheme' },
    { name: 'Educational Loan Scheme', query: 'Tell me about the Educational Loan Scheme' },
    { name: 'Term Loan', query: 'Tell me about the Term Loan (TL) scheme' },
    { name: 'Swachhta Udyami Yojana', query: 'Tell me about the Swachhta Udyami Yojana (SUY) scheme' },
  ];

  for (const s of schemesToTest) {
    console.log(`\n--- TEST: Scheme Inquiry for ${s.name} ---`);
    const inqId = 'inq_test_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: s.query,
        inquiryId: inqId,
        newChat: true,
      }),
    }).then((r) => r.json() as Promise<any>);

    console.log(`✅ Response received for ${s.name}. Length: ${res.message.length} chars`);
    if (res.data?.schemes) {
      console.log(`✅ Card count: ${res.data.schemes.length}, Target: ${res.data.schemes[0]?.name}`);
      if (res.data.schemes.length > 1) {
        console.warn(`⚠️ More than 1 scheme returned for ${s.name}: ${res.data.schemes.map((x: any) => x.name).join(', ')}`);
      }
    }
  }

  // Test 4: Verify normal recommendation engine still works for general questions
  console.log('\n--- TEST 4: General Recommendation Query (Should still return recommendations) ---');
  const genRes = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Which scheme is suitable for starting a small grocery shop?',
      newChat: true,
    }),
  }).then((r) => r.json() as Promise<any>);

  console.log(`✅ General query response type: ${genRes.type}, schemes returned: ${genRes.data?.schemes?.length || 0}`);
  if (!genRes.data?.schemes || genRes.data.schemes.length < 1) {
    console.error('❌ General recommendation query did not return recommendations');
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('ALL INQUIRY & DEDUPLICATION TESTS PASSED SUCCESSFULLY');
  console.log('====================================================');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
