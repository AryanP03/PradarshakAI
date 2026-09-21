/**
 * Lightweight Guest Session Management
 * Stores an anonymous guest session identifier in a cookie for guest chat continuity.
 * Never stores message bodies or transcripts in cookies.
 */

export function getOrCreateGuestSessionId(): string {
  if (typeof document === 'undefined') return '';

  const match = document.cookie.match(/(?:^|;\s*)guest_session_id=([^;]*)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  const newId = 'gst_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  // 30 days expiration, SameSite=Lax, Path=/
  document.cookie = `guest_session_id=${encodeURIComponent(newId)}; path=/; max-age=2592000; SameSite=Lax`;
  return newId;
}
