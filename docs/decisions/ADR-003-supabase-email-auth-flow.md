# ADR-003: Supabase Email Authentication & Verification Strategy

## Status
Accepted

## Context
TripBoard requires secure, enterprise-grade authentication for corporate administrators and employees. In the Next.js migration, authentication was integrated with `@supabase/ssr` and Supabase Auth. To provide an optimal user onboarding and password recovery experience:
1. Users register as corporate admins via `/login` (Register tab) and must verify their email.
2. In enterprise corporate environments, email firewalls, link pre-fetchers, or mobile apps may interact unpredictably with email verification links.
3. Users expect both a 6-digit verification code (OTP) option (as designed in `verify-email-preview.html` and `forgot-password-preview.html`) and direct one-click email confirmation links.
4. Users logging in before completing email verification need a graceful path to trigger a new verification token rather than an opaque generic failure.

## Decision
1. **Dual Email Verification Channel**:
   - Supabase Email Templates (`Confirm signup` and `Reset Password`) will be configured to provide **both** the 6-digit OTP token (`{{ .Token }}`) and the one-click confirmation link (`{{ .ConfirmationURL }}`).
   - The `/verify-email` and `/forgot-password` pages will verify 6-digit OTP codes via `supabase.auth.verifyOtp({ email, token, type: 'signup' | 'recovery' })`.
   - The `/auth/callback` route handler will exchange PKCE `code` for session via `supabase.auth.exchangeCodeForSession(code)` when users click the direct confirmation link.
2. **Role-Aware Auth Callback Redirection**:
   - Upon successful code exchange in `/auth/callback`, query the user's role in `public.profiles`.
   - Route `admin` users to `/admin` and `employee` users to `/employee/dashboard`, eliminating hardcoded `/dashboard` misdirection.
3. **Unconfirmed Email Recovery in Login**:
   - When `supabase.auth.signInWithPassword` returns `Email not confirmed`, the UI will display a dedicated prompt with a direct button to `/verify-email?email=<email>` and offer an immediate resend trigger.
4. **Environment & Redirect Whitelisting**:
   - Whitelist all required callback URLs (`http://localhost:3000/auth/callback`, `http://localhost:3000/verify-email`, `http://localhost:3000/forgot-password`) in the Supabase Dashboard URL Configuration.

## Alternatives Considered
- **Link-only confirmation**: Vulnerable to enterprise security bots pre-fetching and invalidating one-time confirmation links before user click.
- **OTP-only verification**: Requires manual copy-pasting from email, introducing slight friction compared to one-click links on desktop browsers.
- **Dual Support (Selected)**: Gives users the fastest path (click link) with an immediate fallback (enter 6-digit OTP).

## Consequences
- **Positive**: High deliverability, zero lock-out risk from bot link clicks, role-accurate onboarding redirection, and full compatibility with existing approved designs.
- **Operational Requirement**: Project admin must update Supabase email templates in the Supabase Dashboard to include `{{ .Token }}` alongside `{{ .ConfirmationURL }}`.
