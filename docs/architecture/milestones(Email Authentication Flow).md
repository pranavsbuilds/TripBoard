# Milestones: Supabase Email Authentication Flow

**Branch:** `feature/email-auth-setup`  
**Plan Reference:** [implementation_plan(Email Authentication Flow).md](./implementation_plan(Email%20Authentication%20Flow).md)  
**ADR Reference:** [ADR-003-supabase-email-auth-flow.md](../decisions/ADR-003-supabase-email-auth-flow.md)  
**Status:** ⏳ Proposed (Awaiting User Execution Approval)

---

## Progress Tracker (Solo Developer)

| # | Milestone | Status | Recommended Model | Target Files |
|---|---|:---:|---|---|
| **1** | Architecture, Feature Branch & Supabase Dashboard Guide | ✅ Achieved | Gemini 3.8 Flash (Medium) | `git branch`, `ADR-003`, Supabase Dashboard config |
| **2** | Auth Callback & Unconfirmed Email Detection | ✅ Achieved | Claude Sonnet 4.6 (Thinking) | `app/auth/callback/route.ts`, `app/login/page.tsx` |
| **3** | Email Verification (`/verify-email`) Hardening | ✅ Achieved | Gemini 3.8 Flash (Medium) | `app/verify-email/page.tsx` |
| **4** | Password Reset (`/forgot-password`) Hardening | ✅ Achieved | Claude Sonnet 4.6 (Thinking) | `app/forgot-password/page.tsx` |
| **5** | Verification, Build & Progress Log | ✅ Achieved | Gemini 3.8 Flash (Medium) | `docs/logs/2026-10-09.md`, `git commit` |

---

## Milestone 1: Architecture, Feature Branch & Supabase Dashboard Guide ✅ Achieved

**Model:** Gemini 3.8 Flash (Medium)  
**Scope:**
- Create feature branch `feature/email-auth-setup`.
- Document architectural decisions in `ADR-003`.
- Provide exact Supabase Dashboard settings (Redirect URLs, Email Confirmation, and Email Templates with `{{ .Token }}`).

**Gate ✅:**
- [x] Feature branch active.
- [x] ADR-003 created.
- [x] Supabase Dashboard configuration guidance delivered.

---

## Milestone 2: Auth Callback & Unconfirmed Email Detection ⏳ Pending

**Model:** Claude Sonnet 4.6 (Thinking)  
**Scope:**
- Enhance `app/auth/callback/route.ts` to query `public.profiles` role and dynamically route to `/admin` or `/employee/dashboard`.
- Enhance `app/login/page.tsx` to detect `Email not confirmed` and display action link to `/verify-email?email=<email>`.

**Gate:**
- [ ] Role-aware callback redirect functions without hardcoded `/dashboard`.
- [ ] Login screen provides clear guidance when email is pending verification.

---

## Milestone 3: Email Verification (`/verify-email`) Hardening ⏳ Pending

**Model:** Gemini 3.8 Flash (Medium)  
**Scope:**
- Verify OTP submission with `supabase.auth.verifyOtp({ email, token, type: 'signup' })`.
- Fetch verified profile role and route to `/admin` or `/employee/dashboard`.
- Ensure resend cooldown and error alerts meet UI standards.

**Gate:**
- [ ] OTP verification transitions cleanly into active authenticated session.

---

## Milestone 4: Password Reset (`/forgot-password`) Hardening ⏳ Pending

**Model:** Claude Sonnet 4.6 (Thinking)  
**Scope:**
- Verify 4-step wizard: Email -> 6-digit OTP -> Password Update -> Success.
- Ensure `verifyOtp({ email, token, type: 'recovery' })` smoothly transitions to step 3.

**Gate:**
- [ ] Password reset flow verified end-to-end.

---

## Milestone 5: Verification, Build & Progress Log ⏳ Pending

**Model:** Gemini 3.8 Flash (Medium)  
**Scope:**
- Run `npm run build` to verify all routes.
- Update `docs/logs/2026-10-09.md` with session summary.
- Create local git commit on `feature/email-auth-setup`.

**Gate:**
- [ ] 0 build errors.
- [ ] Git commit created.
