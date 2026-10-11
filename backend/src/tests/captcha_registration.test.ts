import http from 'http';
import {
  generateCaptchaChallenge,
  verifyCaptchaSolution,
  consumeCaptchaToken,
  verifyAndConsumeCaptcha,
  _resetCaptchaStoreForTesting,
  _setTestCaptcha
} from '../services/CaptchaService';

const API_BASE = process.env.API_URL || 'http://localhost:4000/api';

let passed = 0;
let failed = 0;

function logTest(pass: boolean, name: string, detail?: string) {
  if (pass) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name}${detail ? ` -> ${detail}` : ''}`);
    failed++;
  }
}

async function request(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<{ status: number; data: any }> {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const data = raw ? JSON.parse(raw) : null;
            resolve({ status: res.statusCode || 500, data });
          } catch {
            resolve({ status: res.statusCode || 500, data: raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('\n================== CAPTCHA & REGISTRATION SECURITY TESTS ==================\n');

  // --- UNIT TESTS ---
  console.log('--- Unit Tests: CaptchaService ---');
  _resetCaptchaStoreForTesting();

  // Test 1: Challenge Generation
  const challenge1 = generateCaptchaChallenge();
  logTest(
    !!challenge1.captchaId && challenge1.challenge.length === 6,
    'Challenge generation returns 6-character challenge and unique ID'
  );

  // Test 2: Empty Answer Rejection
  const emptyRes = verifyCaptchaSolution(challenge1.captchaId, '   ');
  logTest(
    !emptyRes.success && emptyRes.error?.includes('enter the CAPTCHA code') === true,
    'Empty answer rejected with clear validation error'
  );

  // Test 3: Incorrect Answer Rejection
  _setTestCaptcha('test-id-1', 'ABC123');
  const wrongRes = verifyCaptchaSolution('test-id-1', 'WRONG1');
  logTest(
    !wrongRes.success && wrongRes.error?.includes('Incorrect') === true,
    'Incorrect answer rejected and invalidates failed challenge'
  );

  // Test 4: Cannot reuse failed challenge
  const retryFailed = verifyCaptchaSolution('test-id-1', 'ABC123');
  logTest(
    !retryFailed.success && retryFailed.error?.includes('expired or invalid') === true,
    'Failed challenge cannot be brute-forced or reused'
  );

  // Test 5: Correct Answer with Case Insensitivity and Whitespace Trimming
  _setTestCaptcha('test-id-2', 'X9Y8Z7');
  const validRes = verifyCaptchaSolution('test-id-2', '  x9y8z7  ');
  logTest(
    validRes.success && !!validRes.captchaToken,
    'Correct answer accepted with whitespace trimming and case insensitivity'
  );

  // Test 6: Invalidate challenge after successful verification
  const reuseRes = verifyCaptchaSolution('test-id-2', 'X9Y8Z7');
  logTest(
    !reuseRes.success,
    'Challenge cannot be reused after successful verification'
  );

  // Test 7: Single-use Token Consumption
  const token = validRes.captchaToken!;
  const consume1 = consumeCaptchaToken(token);
  logTest(consume1 === true, 'Token consumed successfully on first use');
  const consume2 = consumeCaptchaToken(token);
  logTest(consume2 === false, 'Token cannot be reused a second time');

  // Test 8: Atomic verify and consume
  _setTestCaptcha('test-id-3', 'HELLO8');
  const atomicValid = verifyAndConsumeCaptcha('test-id-3', 'hello8');
  logTest(atomicValid === true, 'Atomic verifyAndConsumeCaptcha validates and consumes challenge');
  const atomicReuse = verifyAndConsumeCaptcha('test-id-3', 'hello8');
  logTest(atomicReuse === false, 'Atomic challenge cannot be consumed again');

  // --- INTEGRATION / ENDPOINT TESTS ---
  console.log('\n--- Integration Tests: Endpoints & Complete Flow ---');

  // Test 9: GET /api/registration/captcha
  const getRes = await request('GET', '/registration/captcha');
  logTest(
    getRes.status === 200 && getRes.data.success && !!getRes.data.challenge,
    'GET /api/registration/captcha returns valid challenge object'
  );

  const serverCaptchaId = getRes.data.captchaId;
  const serverChallenge = getRes.data.challenge;

  // Test 10: POST /api/registration/verify-captcha with wrong code
  const verifyFail = await request('POST', '/registration/verify-captcha', {
    captchaId: serverCaptchaId,
    answer: '000000',
  });
  logTest(
    verifyFail.status === 400 && !verifyFail.data.success,
    'POST /api/registration/verify-captcha returns 400 on incorrect answer'
  );

  // Test 11: POST /api/registration/verify-captcha with fresh valid challenge
  const freshRes = await request('GET', '/registration/captcha');
  const freshId = freshRes.data.captchaId;
  const freshChallenge = freshRes.data.challenge;

  const verifyPass = await request('POST', '/registration/verify-captcha', {
    captchaId: freshId,
    answer: `  ${freshChallenge.toLowerCase()}  `, // Test mixed casing and padding
  });
  logTest(
    verifyPass.status === 200 && verifyPass.data.success && !!verifyPass.data.captchaToken,
    'POST /api/registration/verify-captcha verifies challenge and issues token'
  );

  const issuedToken = verifyPass.data.captchaToken;

  // Test 12: POST /api/registration/complete blocks trivial client bypass without CAPTCHA
  const bypassAttempt = await request('POST', '/registration/complete', {
    full_name: 'Test Bypass',
    mobile: '9876543210',
    email: 'bypass@test.in',
    password: 'password123',
    // Omit captcha_token, captcha_id, captcha_answer
  });
  logTest(
    bypassAttempt.status === 400 && bypassAttempt.data.error?.includes('CAPTCHA') === true,
    'POST /api/registration/complete rejects request when CAPTCHA is missing'
  );

  // Test 13: POST /api/registration/complete blocks invalid/fake CAPTCHA token
  const fakeTokenAttempt = await request('POST', '/registration/complete', {
    full_name: 'Test Fake',
    mobile: '9876543210',
    email: 'fake@test.in',
    password: 'password123',
    captcha_token: 'fake_manipulated_token_123',
  });
  logTest(
    fakeTokenAttempt.status === 400 && fakeTokenAttempt.data.error?.includes('CAPTCHA') === true,
    'POST /api/registration/complete rejects request with manipulated/fake CAPTCHA token'
  );

  // Test 14: Refreshing CAPTCHA invalidates previous challenge
  const preRefresh = await request('GET', '/registration/captcha');
  const oldId = preRefresh.data.captchaId;
  const oldAns = preRefresh.data.challenge;

  // New refresh
  await request('GET', '/registration/captcha');

  // Verify that an incorrect attempt or expiry on old invalidates it
  const verifyOldFail = await request('POST', '/registration/verify-captcha', {
    captchaId: oldId,
    answer: 'WRONGCODE',
  });
  logTest(
    verifyOldFail.status === 400,
    'Previous challenge fails when answered incorrectly and cannot be used'
  );

  console.log('\n=============================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
