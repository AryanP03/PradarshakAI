import crypto from 'crypto';

interface CaptchaItem {
  answer: string;
  expiresAt: number;
}

// In-memory store for pending challenges
const captchaStore = new Map<string, CaptchaItem>();

// In-memory store for verified one-time tokens
const verifiedTokens = new Map<string, number>();

// Clean up expired items periodically (every 5 minutes)
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, item] of captchaStore.entries()) {
    if (now > item.expiresAt) {
      captchaStore.delete(id);
    }
  }
  for (const [token, expiresAt] of verifiedTokens.entries()) {
    if (now > expiresAt) {
      verifiedTokens.delete(token);
    }
  }
}, 5 * 60 * 1000);
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

// Readable alphanumeric characters excluding ambiguous characters (0, O, 1, I)
const CHARACTERS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generate a random 6-character alphanumeric CAPTCHA challenge.
 */
export function generateCaptchaChallenge(): { captchaId: string; challenge: string } {
  let challenge = '';
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * CHARACTERS.length);
    challenge += CHARACTERS[idx];
  }
  const captchaId = crypto.randomUUID();
  // 10 minutes expiry
  captchaStore.set(captchaId, {
    answer: challenge,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
  return { captchaId, challenge };
}

/**
 * Verify a user's answer against the stored CAPTCHA challenge.
 * Trims whitespace and handles case insensitively.
 * Invalids/removes challenge on check to prevent reuse/brute-force.
 */
export function verifyCaptchaSolution(
  captchaId?: string,
  answer?: string
): { success: boolean; error?: string; captchaToken?: string } {
  if (!captchaId) {
    return { success: false, error: 'CAPTCHA session missing. Please refresh the CAPTCHA.' };
  }
  const item = captchaStore.get(captchaId);
  if (!item) {
    return { success: false, error: 'CAPTCHA expired or invalid. Please refresh the code.' };
  }
  if (Date.now() > item.expiresAt) {
    captchaStore.delete(captchaId);
    return { success: false, error: 'This CAPTCHA has expired. Please refresh the code.' };
  }

  const trimmed = (answer || '').trim();
  if (!trimmed) {
    return { success: false, error: 'Please enter the CAPTCHA code.' };
  }

  // Consistent case-insensitive comparison
  if (trimmed.toUpperCase() !== item.answer.toUpperCase()) {
    // Invalidate this attempt to prevent brute-force attacks
    captchaStore.delete(captchaId);
    return { success: false, error: 'Incorrect CAPTCHA code. Please try again.' };
  }

  // Successfully verified: remove from pending store to prevent reuse
  captchaStore.delete(captchaId);

  // Issue a single-use verification token valid for 15 minutes
  const captchaToken = 'cap_' + crypto.randomUUID();
  verifiedTokens.set(captchaToken, Date.now() + 15 * 60 * 1000);

  return { success: true, captchaToken };
}

/**
 * Consumes a verified one-time token. Returns true if valid, false otherwise.
 * Once consumed, the token is deleted immediately to prevent reuse.
 */
export function consumeCaptchaToken(token?: string): boolean {
  if (!token) return false;
  const expiresAt = verifiedTokens.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    verifiedTokens.delete(token);
    return false;
  }
  // Single-use: delete immediately
  verifiedTokens.delete(token);
  return true;
}

/**
 * Verifies and consumes CAPTCHA during complete registration.
 * Accepts either pre-verified captchaToken OR atomic (captchaId + answer).
 */
export function verifyAndConsumeCaptcha(
  captchaId?: string,
  answer?: string,
  captchaToken?: string
): boolean {
  if (captchaToken && consumeCaptchaToken(captchaToken)) {
    return true;
  }
  if (captchaId && answer) {
    const res = verifyCaptchaSolution(captchaId, answer);
    if (res.success && res.captchaToken) {
      consumeCaptchaToken(res.captchaToken);
      return true;
    }
  }
  return false;
}

/**
 * Helpers for unit tests
 */
export function _resetCaptchaStoreForTesting(): void {
  captchaStore.clear();
  verifiedTokens.clear();
}

export function _setTestCaptcha(
  captchaId: string,
  answer: string,
  expiresInMs: number = 600000
): void {
  captchaStore.set(captchaId, {
    answer,
    expiresAt: Date.now() + expiresInMs,
  });
}
