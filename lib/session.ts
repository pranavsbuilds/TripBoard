/**
 * Validates a redirect target is a safe internal path.
 * Prevents open redirect vulnerabilities.
 */
export function sanitizeRedirect(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw) return fallback;
  if (raw.startsWith('/') && !raw.startsWith('//')) {
    return raw;
  }
  return fallback;
}
