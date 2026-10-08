export const MAX_PASSWORD_LENGTH = 128;

/**
 * Validates password strength:
 * - Min 8 characters, max 128
 * - At least one letter and one number
 */
export function validatePasswordStrength(password: string): { valid: boolean; message: string } {
  if (!password) return { valid: false, message: 'Password is required.' };
  if (password.length > MAX_PASSWORD_LENGTH) return { valid: false, message: `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.` };
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters long.' };
  if (!/[A-Za-z]/.test(password)) return { valid: false, message: 'Password must contain at least one letter.' };
  if (!/\d/.test(password)) return { valid: false, message: 'Password must contain at least one number.' };
  return { valid: true, message: '' };
}
