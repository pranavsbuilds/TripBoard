# ADR-003: Supabase Email Authentication & Verification Strategy

## Status
Accepted

## Context
TripBoard requires secure, enterprise-grade authentication for corporate administrators and employees. In the Next.js migration, authentication was integrated with `@supabase/ssr` and Supabase Auth. To provide an optimal user onboarding and password recovery experience:
1. Users register as corporate admins via `/login` (Register tab) and must verify their email.
2. In enterprise corporate environments, email firewalls, link pre-fetchers, or mobile apps may interact unpredictably with email verification links.
3. To avoid these link-prefetching issues entirely, users will be provided with a 6-digit verification code (OTP) option (as designed in `verify-email-preview.html` and `forgot-password-preview.html`).
4. Users logging in before completing email verification need a graceful path to trigger a new verification token rather than an opaque generic failure.

## Decision
1. **OTP-Only Email Verification & Password Recovery**:
   - Supabase Email Templates (`Confirm signup` and `Reset Password`) will be configured to provide **only** the 6-digit OTP token (`{{ .Token }}`). The `{{ .ConfirmationURL }}` magic link will be omitted.
   - The `/verify-email` and `/forgot-password` pages will exclusively handle verification of the 6-digit OTP codes via `supabase.auth.verifyOtp({ email, token, type: 'signup' | 'recovery' })`.
   - The magic link `/auth/callback` route handler has been entirely removed as it is no longer needed.
2. **Role-Aware Post-Verification Routing**:
   - Upon successful OTP verification in `/verify-email`, the frontend queries the user's role in `public.profiles`.
   - Route `admin` users to `/admin` and `employee` users to `/employee/dashboard`, eliminating hardcoded `/dashboard` misdirection.
3. **Unconfirmed Email Recovery in Login**:
   - When `supabase.auth.signInWithPassword` returns `Email not confirmed`, the UI will display a dedicated prompt with a direct button to `/verify-email?email=<email>` and offer an immediate resend trigger.
4. **Environment & Redirect Whitelisting**:
   - Since magic links are removed, only local routes need whitelisting if strict origin checks are enforced, though `emailRedirectTo` is no longer passed in auth functions.

## Alternatives Considered
- **Link-only confirmation**: Vulnerable to enterprise security bots pre-fetching and invalidating one-time confirmation links before user click.
- **Dual Support (Link + OTP)**: Adds unnecessary complexity. Maintaining two pathways requires the `/auth/callback` endpoint and invites edge cases where bots still consume the link, confusing the user who tries to use the OTP.
- **OTP-only verification (Selected)**: The most secure and robust approach against enterprise firewalls. Requires manual input, but guarantees delivery and predictability.

## Consequences
- **Positive**: Zero lock-out risk from bot link clicks, deterministic state, fully simplified authentication surface area, and full compatibility with existing approved designs.
- **Operational Requirement**: Project admin must update Supabase email templates in the Supabase Dashboard to remove `{{ .ConfirmationURL }}` and purely rely on `{{ .Token }}`.
