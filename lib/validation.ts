import { z } from 'zod';

export const emailSchema = z.string().trim().min(1, 'Email is required').email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be 128 characters or fewer')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

export const otpSchema = z.string().trim().length(6, 'Code must be exactly 6 digits').regex(/^\d{6}$/, 'Code must contain only numbers');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    otp: otpSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ==============================================================================
// Travel Document File Validation
// ==============================================================================

/** Strict 1 MB ceiling: files must be strictly less than this value (in bytes). */
export const MAX_DOC_FILE_SIZE = 1_048_576; // 1 MB

/** Allowed MIME types for travel document uploads. */
export const ALLOWED_DOC_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedDocMimeType = (typeof ALLOWED_DOC_MIME_TYPES)[number];

/** Valid document type keys matching the DB constraint. */
export const DOCUMENT_TYPES = ['passport', 'visa', 'ticket', 'gov_id', 'hotel', 'insurance', 'other'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Human-readable labels for each document type. */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  passport: 'Passport',
  visa: 'Visa',
  ticket: 'Flight Ticket',
  gov_id: 'Government ID Proof',
  hotel: 'Hotel Booking',
  insurance: 'Travel Insurance',
  other: 'Other Document',
};

export interface DocumentValidationError {
  field: 'size' | 'type';
  message: string;
}

/**
 * Validates a travel document File object against size and MIME type rules.
 * Returns null if valid; returns an error descriptor if invalid.
 * Safe to call on both client (browser File) and server (use file.size / file.type).
 */
export function validateTravelDocument(file: { size: number; type: string; name: string }): DocumentValidationError | null {
  if (file.size >= MAX_DOC_FILE_SIZE) {
    return {
      field: 'size',
      message: `File "${file.name}" exceeds the 1 MB limit (${(file.size / 1_048_576).toFixed(2)} MB). Please upload a smaller file.`,
    };
  }

  if (!ALLOWED_DOC_MIME_TYPES.includes(file.type as AllowedDocMimeType)) {
    return {
      field: 'type',
      message: `File type "${file.type || 'unknown'}" is not supported. Accepted formats: PDF, JPG, PNG, WebP.`,
    };
  }

  return null;
}
