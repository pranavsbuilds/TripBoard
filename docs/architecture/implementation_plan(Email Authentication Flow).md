# Implementation Plan: Supabase Email Authentication Flow

**Branch:** `feature/email-auth-setup`  
**Reference ADR:** [ADR-003-supabase-email-auth-flow.md](../decisions/ADR-003-supabase-email-auth-flow.md)  
**Reference Designs:**
- [DESIGNS/login-preview.html](file:///c:/projects/TripBoard/DESIGNS/login-preview.html)
- [DESIGNS/verify-email-preview.html](file:///c:/projects/TripBoard/DESIGNS/verify-email-preview.html)
- [DESIGNS/forgot-password-preview.html](file:///c:/projects/TripBoard/DESIGNS/forgot-password-preview.html)

---

## 1. Objective
Establish a complete, robust, enterprise-grade Supabase Email Authentication flow for TripBoard. The flow encompasses:
1. **Admin Registration & Verification**: Admin signs up -> receives email with both 6-digit verification code (`{{ .Token }}`) and 1-click confirmation link (`{{ .ConfirmationURL }}`) -> confirms via `/verify-email` OTP or `/auth/callback` link -> lands on `/admin`.
2. **Login Graceful Recovery**: If an unconfirmed user attempts to log in, detects `Email not confirmed` and routes them smoothly to `/verify-email` with resend capabilities.
3. **Role-Aware Callback Handling**: When confirmation links or recovery links are clicked, `/auth/callback` handles the PKCE code exchange and redirects dynamically to `/admin` or `/employee/dashboard` according to `profiles.role`.
4. **Password Recovery**: Admin or employee requests reset -> receives OTP/link -> verifies OTP on `/forgot-password` -> updates password -> logs in.
5. **Supabase Dashboard Setup Guide**: Precise instructions for Supabase Dashboard URL configuration and email template tokens.

---

## 2. Technical Scope & Architecture

### A. Supabase Dashboard Configuration
- **Site URL**: `http://localhost:3000`
- **Redirect URLs Whitelist**:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/verify-email`
  - `http://localhost:3000/forgot-password`
  - `http://localhost:3000/admin`
  - `http://localhost:3000/employee/dashboard`
- **Email Provider Settings**:
  - `Enable Email provider`: Enabled
  - `Confirm email`: Enabled
  - `Secure email change`: Enabled
  - `Mailer Autoconfirm`: Disabled (production mode)
- **Email Templates**:
  - **Confirm signup**: Updated to include both the 6-digit OTP code (`{{ .Token }}`) and direct confirmation link (`<a href="{{ .ConfirmationURL }}">Confirm Email</a>`).
  - **Reset Password**: Updated to include both the 6-digit recovery code (`{{ .Token }}`) and direct reset link (`<a href="{{ .ConfirmationURL }}">Reset Password</a>`).

### B. Route & Component Architecture
1. **`app/auth/callback/route.ts`**:
   - Accepts `code` query parameter and exchanges for session via `supabase.auth.exchangeCodeForSession(code)`.
   - Fetches user record and queries `profiles.role` to determine destination:
     - `admin` -> `/admin`
     - `employee` -> `/employee/dashboard`
     - Fallback / error -> `/login?error=auth_callback_failed`
2. **`app/login/page.tsx`**:
   - Enhances error handling for `signInWithPassword`: detects `Email not confirmed` and presents user-friendly alert with direct link to verify email.
   - Preserves admin registration with `emailRedirectTo: ${origin}/auth/callback`.
3. **`app/verify-email/page.tsx`**:
   - Validates 6-digit OTP via `supabase.auth.verifyOtp({ email, token, type: 'signup' })`.
   - On success, checks role and routes to `/admin` or `/employee/dashboard`.
   - Resend button with 60s cooldown calling `supabase.auth.resend({ type: 'signup', email })`.
4. **`app/forgot-password/page.tsx`**:
   - Step 1: `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/forgot-password` })`.
   - Step 2: `supabase.auth.verifyOtp({ email, token, type: 'recovery' })`.
   - Step 3: `supabase.auth.updateUser({ password })`.
   - Step 4: Success confirmation screen and redirect to `/login`.

---

## 3. Milestones Breakdown

| Milestone | Title | Scope | Gate / Deliverable |
|:---:|---|---|---|
| **1** | Architecture & Supabase Configuration Guide | Feature branch setup, ADR-003, configuration documentation for Supabase Dashboard | Branch created, docs prepared |
| **2** | Auth Callback & Login Error Handling | Role-aware `/auth/callback`, unconfirmed email detection in `/login` | Verified role-based routing & login prompts |
| **3** | Email Verification (`/verify-email`) Hardening | OTP verification, role routing, resend cooldown logic | OTP verification tested and verified |
| **4** | Password Reset (`/forgot-password`) Hardening | 4-step wizard with OTP recovery and password update | Password reset flow verified end-to-end |
| **5** | Verification, Build & Daily Progress Log | `npm run build` verification, log in `docs/logs/2026-10-09.md`, git commit | 0 build errors, clean git commit |

---

## 4. Verification Checklist
- [ ] Next.js app builds cleanly with `npm run build`.
- [ ] `/auth/callback` exchanges code and routes by role.
- [ ] `/login` handles unconfirmed email gracefully.
- [ ] `/verify-email` handles 6-digit OTP verification and resend cooldown.
- [ ] `/forgot-password` handles 4-step recovery flow with validation.
