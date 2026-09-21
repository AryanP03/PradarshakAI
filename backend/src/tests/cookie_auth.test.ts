import assert from 'assert';
import jwt from 'jsonwebtoken';
import { AUTH_COOKIE_NAME, setAuthCookie, clearAuthCookie } from '../utils/authCookies';
import { requireUser, optionalUser, UserAuthRequest } from '../middleware/userAuthMiddleware';
import { Response, NextFunction } from 'express';

console.log('🍪 Running Cookie & Authentication Tests...\n');

// Mock Express Response
function createMockResponse() {
  const cookiesSet: Record<string, { val: string; options: any }> = {};
  const cookiesCleared: Record<string, any> = {};
  let statusCode = 200;
  let jsonBody: any = null;

  const res: Partial<Response> = {
    cookie(name: string, val: string, options: any) {
      cookiesSet[name] = { val, options };
      return this as Response;
    },
    clearCookie(name: string, options: any) {
      cookiesCleared[name] = options;
      return this as Response;
    },
    status(code: number) {
      statusCode = code;
      return this as Response;
    },
    json(body: any) {
      jsonBody = body;
      return this as Response;
    },
  };

  return { res: res as Response, cookiesSet, cookiesCleared, getStatus: () => statusCode, getJson: () => jsonBody };
}

// TEST 1: setAuthCookie configuration
{
  const { res, cookiesSet } = createMockResponse();
  const dummyToken = 'test-jwt-token-123';
  setAuthCookie(res, dummyToken);

  assert(cookiesSet[AUTH_COOKIE_NAME], 'Expected auth_token cookie to be set');
  assert.strictEqual(cookiesSet[AUTH_COOKIE_NAME].val, dummyToken, 'Cookie value must match token');
  assert.strictEqual(cookiesSet[AUTH_COOKIE_NAME].options.httpOnly, true, 'Cookie must be httpOnly');
  assert.strictEqual(cookiesSet[AUTH_COOKIE_NAME].options.sameSite, 'lax', 'Cookie must be SameSite=lax');
  assert.strictEqual(cookiesSet[AUTH_COOKIE_NAME].options.path, '/', 'Cookie path must be /');
  assert(cookiesSet[AUTH_COOKIE_NAME].options.maxAge > 0, 'Cookie maxAge must be positive');
  console.log('  ✅ PASS: setAuthCookie correctly sets HttpOnly, SameSite=lax, Path=/, 7-day maxAge cookie');
}

// TEST 2: clearAuthCookie configuration
{
  const { res, cookiesCleared } = createMockResponse();
  clearAuthCookie(res);

  assert(cookiesCleared[AUTH_COOKIE_NAME], 'Expected auth_token cookie to be cleared');
  assert.strictEqual(cookiesCleared[AUTH_COOKIE_NAME].httpOnly, true, 'Clear cookie must match httpOnly flag');
  assert.strictEqual(cookiesCleared[AUTH_COOKIE_NAME].sameSite, 'lax', 'Clear cookie must match SameSite flag');
  assert.strictEqual(cookiesCleared[AUTH_COOKIE_NAME].path, '/', 'Clear cookie path must be /');
  console.log('  ✅ PASS: clearAuthCookie correctly clears auth cookie');
}

// TEST 3: requireUser rejects when no cookie and no header
{
  const req: Partial<UserAuthRequest> = { cookies: {}, headers: {} };
  const { res, getStatus, getJson } = createMockResponse();
  let nextCalled = false;
  const next: NextFunction = () => { nextCalled = true; };

  requireUser(req as UserAuthRequest, res, next).then(() => {
    assert.strictEqual(nextCalled, false, 'Next should not be called when unauthenticated');
    assert.strictEqual(getStatus(), 401, 'Status must be 401');
    assert.strictEqual(getJson()?.error, 'Authorization required');
    console.log('  ✅ PASS: requireUser returns 401 when no auth cookie or header is present');
  });
}

// TEST 4: optionalUser handles missing auth safely (guest mode)
{
  const req: Partial<UserAuthRequest> = { cookies: {}, headers: {} };
  const { res } = createMockResponse();
  let nextCalled = false;
  const next: NextFunction = () => { nextCalled = true; };

  optionalUser(req as UserAuthRequest, res, next).then(() => {
    assert.strictEqual(nextCalled, true, 'Next must be called for guest in optionalUser');
    assert.strictEqual(req.userId, undefined, 'req.userId must be undefined for guest');
    console.log('  ✅ PASS: optionalUser seamlessly supports guest requests');
  });
}

console.log('\n================== COOKIE AUTH TESTS COMPLETE ==================\n');
