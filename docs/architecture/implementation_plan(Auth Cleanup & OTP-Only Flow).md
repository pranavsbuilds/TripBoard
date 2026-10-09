# Implementation Plan: Auth Cleanup & OTP-Only Flow

## Objective
Remove unused `login_export` UI artifacts and transition the application to a strict 6-digit OTP email verification and password recovery flow, completely removing magic link/confirmation URL workflows.

---

## Milestone 1: Clean Up `login_export` UI & Assets ✅ Achieved
*Removes all legacy cyber-tech UI assets and the unbundled template folder.*

1. **Delete Legacy Files:**
   - Delete the `login_export/` directory.
   - Delete `styles/auth.css`.
   - Delete `docs/designs/auth-system-preview.html`.
2. **Update Config & Globals:**
   - Remove `@import '../styles/auth.css';` from `app/globals.css`.
   - Remove `login_export/` from `.gitignore`.
   - Remove `"login_export"` from the `exclude` array in `tsconfig.json`.

---

## Milestone 2: Refactor to OTP-Only Flow ✅ Achieved
*Strips out PKCE exchange and magic link redirect configurations, relying purely on `supabase.auth.verifyOtp`.*

1. **Delete Auth Callback Route:**
   - Delete `app/auth/callback/route.ts` (obsolete without clickable email links).
2. **Update `app/login/page.tsx`:**
   - Inside `handleRegister`, remove `options: { emailRedirectTo: ... }` from the `supabase.auth.signUp` call.
3. **Update `app/forgot-password/page.tsx`:**
   - Inside `handleRequestOtp` and `handleResend`, remove `options: { redirectTo: ... }` from the `supabase.auth.resetPasswordForEmail` call.

---

## Milestone 3: Documentation Updates ✅ Achieved
*Aligns architectural decisions and plans with the new OTP-only reality.*

1. **Update ADR-003 (`docs/decisions/ADR-003-supabase-email-auth-flow.md`):**
   - Change the decision from "Dual Email Verification Channel" to "OTP-Only Email Verification".
   - Note that email templates should exclusively use `{{ .Token }}` and omit `{{ .ConfirmationURL }}`.
   - Remove references to `/auth/callback`.
2. **Update Auth Implementation Plans:**
   - Clean up `docs/architecture/implementation_plan(Email Authentication Flow).md` to reflect the removal of magic links.
