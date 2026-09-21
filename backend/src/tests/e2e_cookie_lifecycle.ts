import assert from 'assert';

const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3000';

console.log('🚀 Starting PradarshakAI Cookie & Session Architecture Lifecycle Test Suite...\n');

async function runLifecycleTests() {
  const timestamp = Date.now();
  const testEmail = `cookie_test_${timestamp}@gmail.com`;
  const testPassword = 'Password@123';
  const testPhone = '98765' + String(timestamp).slice(-5);
  const testName = 'Cookie Test User';

  let authCookie = '';

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 1: User Registration establishes authenticated HttpOnly cookie
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('TEST 1: User Registration establishes authenticated HttpOnly cookie');
  const regRes = await fetch(`${BACKEND_URL}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': FRONTEND_URL },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      phone: testPhone,
      password: testPassword,
      salary: 180000,
    }),
  });

  assert.strictEqual(regRes.status, 201, `Registration failed with status ${regRes.status}`);
  const setCookieHeader = regRes.headers.get('set-cookie');
  assert(setCookieHeader, 'Set-Cookie header must be present on registration');
  assert(setCookieHeader.includes('auth_token='), 'Set-Cookie must set auth_token');
  assert(setCookieHeader.toLowerCase().includes('httponly'), 'auth_token cookie must be HttpOnly');
  assert(setCookieHeader.toLowerCase().includes('samesite=lax'), 'auth_token cookie must be SameSite=Lax');
  assert(setCookieHeader.includes('Path=/'), 'auth_token cookie path must be /');

  // Extract auth_token value
  const cookieMatch = setCookieHeader.match(/auth_token=([^;]+)/);
  assert(cookieMatch && cookieMatch[1], 'auth_token value must be extracted');
  authCookie = `auth_token=${cookieMatch[1]}`;
  console.log('  ✅ PASS: Backend sets secure HttpOnly, SameSite=Lax cookie on registration');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 2: CORS verification for credentialed requests
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('TEST 2: CORS verification for localhost & LAN origins');
  const corsHeaders = {
    'access-control-allow-credentials': regRes.headers.get('access-control-allow-credentials'),
    'access-control-allow-origin': regRes.headers.get('access-control-allow-origin'),
  };
  assert.strictEqual(corsHeaders['access-control-allow-credentials'], 'true', 'CORS credentials must be true');
  assert.strictEqual(corsHeaders['access-control-allow-origin'], FRONTEND_URL, 'Origin must be explicitly reflected, not *');

  // Test LAN IP origin CORS
  const lanOrigin = 'http://192.168.1.50:3000';
  const lanRes = await fetch(`${BACKEND_URL}/api/users/me`, {
    headers: { 'Origin': lanOrigin },
  });
  assert.strictEqual(lanRes.headers.get('access-control-allow-origin'), lanOrigin, 'LAN IP origin must be permitted');
  assert.strictEqual(lanRes.headers.get('access-control-allow-credentials'), 'true', 'LAN IP credentials must be true');
  console.log('  ✅ PASS: CORS correctly configured for credentialed requests across localhost & LAN');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 3: Authenticated request to /api/users/me using HttpOnly Cookie
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('TEST 3: Authenticated profile retrieval via cookie without Authorization header');
  const meRes = await fetch(`${BACKEND_URL}/api/users/me`, {
    headers: {
      'Cookie': authCookie,
      'Origin': FRONTEND_URL,
    },
  });
  assert.strictEqual(meRes.status, 200, `/me returned status ${meRes.status}`);
  const meData = await meRes.json();
  assert.strictEqual(meData.email, testEmail, 'Retrieved user email must match registered user');
  assert.strictEqual(meData.guest, undefined, 'User must not be marked as guest');
  console.log('  ✅ PASS: /api/users/me successfully authenticates via HttpOnly cookie alone');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 4: Authenticated request to /api/chats using HttpOnly Cookie
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('TEST 4: Authenticated protected chats endpoint via cookie');
  const chatsRes = await fetch(`${BACKEND_URL}/api/chats`, {
    headers: {
      'Cookie': authCookie,
      'Origin': FRONTEND_URL,
    },
  });
  assert.strictEqual(chatsRes.status, 200, `Protected /api/chats returned status ${chatsRes.status}`);
  const chatsData = await chatsRes.json();
  assert(Array.isArray(chatsData), 'Chats response must be an array');
  console.log('  ✅ PASS: /api/chats successfully loads chats using auth cookie');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 5: Unauthenticated access to /api/users/me falls back to guest mode
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('TEST 5: Unauthenticated /api/users/me returns guest mode');
  const guestMeRes = await fetch(`${BACKEND_URL}/api/users/me`);
  assert.strictEqual(guestMeRes.status, 200);
  const guestMeData = await guestMeRes.json();
  assert.strictEqual(guestMeData.guest, true, 'Unauthenticated user must have guest: true');
  console.log('  ✅ PASS: Unauthenticated /api/users/me cleanly returns { guest: true }');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 6: Unauthenticated access to protected route /api/chats is rejected
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('TEST 6: Unauthenticated request to /api/chats rejected with 401');
  const unauthChatsRes = await fetch(`${BACKEND_URL}/api/chats`);
  assert.strictEqual(unauthChatsRes.status, 401, 'Unauthenticated /api/chats must return 401');
  console.log('  ✅ PASS: Protected endpoint returns 401 when no auth cookie or header is sent');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 7: Logout clears the HttpOnly cookie
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('TEST 7: Logout clears auth_token cookie server-side');
  const logoutRes = await fetch(`${BACKEND_URL}/api/users/logout`, {
    method: 'POST',
    headers: {
      'Cookie': authCookie,
      'Origin': FRONTEND_URL,
    },
  });
  assert.strictEqual(logoutRes.status, 200, `Logout returned status ${logoutRes.status}`);
  const logoutSetCookie = logoutRes.headers.get('set-cookie');
  assert(logoutSetCookie, 'Logout must send Set-Cookie header to clear cookie');
  assert(
    logoutSetCookie.includes('auth_token=;') || logoutSetCookie.includes('auth_token=;') || logoutSetCookie.includes('Expires=Thu, 01 Jan 1970') || logoutSetCookie.includes('Max-Age=0'),
    'Logout must invalidate the auth_token cookie'
  );
  console.log('  ✅ PASS: POST /api/users/logout successfully clears auth_token cookie');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 8: Login establishes a new authenticated HttpOnly cookie
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('TEST 8: Login establishes a new authenticated HttpOnly cookie');
  const loginRes = await fetch(`${BACKEND_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': FRONTEND_URL },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });
  assert.strictEqual(loginRes.status, 200, `Login failed with status ${loginRes.status}`);
  const loginSetCookie = loginRes.headers.get('set-cookie');
  assert(loginSetCookie, 'Set-Cookie header must be present on login');
  assert(loginSetCookie.includes('auth_token='), 'Set-Cookie must set auth_token on login');
  assert(loginSetCookie.toLowerCase().includes('httponly'), 'auth_token cookie must be HttpOnly on login');
  console.log('  ✅ PASS: Backend establishes secure HttpOnly cookie on login');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 9: Next.js Server-Side Route Protection (middleware.ts)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('TEST 9: Next.js middleware redirects unauthenticated requests to /profile');
  const mwRes = await fetch(`${FRONTEND_URL}/profile`, {
    redirect: 'manual', // Do not auto-follow redirect so we can inspect 307/302
  });
  assert(
    mwRes.status === 307 || mwRes.status === 308 || mwRes.status === 302 || mwRes.status === 303,
    `Expected redirect status, got ${mwRes.status}`
  );
  const location = mwRes.headers.get('location');
  assert(location && location.includes('/auth'), `Redirect location must point to /auth, got ${location}`);
  console.log('  ✅ PASS: Next.js middleware intercepts /profile and redirects to /auth');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 10: Next.js allows authenticated access to /profile with auth_token cookie
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('TEST 10: Next.js middleware allows /profile access when auth_token cookie is provided');
  const newCookieMatch = loginSetCookie.match(/auth_token=([^;]+)/);
  assert(newCookieMatch && newCookieMatch[1]);
  const newAuthCookie = `auth_token=${newCookieMatch[1]}`;

  const authProfileRes = await fetch(`${FRONTEND_URL}/profile`, {
    headers: {
      'Cookie': newAuthCookie,
    },
    redirect: 'manual',
  });
  assert.strictEqual(authProfileRes.status, 200, `Expected status 200 for authenticated /profile, got ${authProfileRes.status}`);
  console.log('  ✅ PASS: Next.js middleware permits /profile access with auth_token cookie');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 11: Public routes remain unrestricted without auth cookie
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('TEST 11: Public routes remain open and unblocked');
  const homeRes = await fetch(`${FRONTEND_URL}/`);
  assert.strictEqual(homeRes.status, 200, 'Home route must be accessible');
  const schemesRes = await fetch(`${FRONTEND_URL}/schemes`);
  assert.strictEqual(schemesRes.status, 200, 'Schemes route must be accessible');
  const chatRes = await fetch(`${FRONTEND_URL}/chat`);
  assert.strictEqual(chatRes.status, 200, 'Chat route must be accessible');
  console.log('  ✅ PASS: Public routes (/, /schemes, /chat) remain accessible to guests');

  console.log('\n🎉 ALL 11 E2E COOKIE & SESSION LIFECYCLE TESTS PASSED CLEANLY!\n');
}

runLifecycleTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
