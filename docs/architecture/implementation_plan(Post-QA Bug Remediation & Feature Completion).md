# Implementation Plan: Post-QA Bug Remediation & Feature Completion

Remediates all bugs and feature gaps reported in **Test Suite 1 (IAM)** and **Test Suite 3 (Employee & Coordinator Workflows)**, restoring missing header assets, unblocking admin flows, completing interactive coordinator and document upload actions, and enforcing India-specific validation rules.

---

## 1. Background & Root Cause Analysis

Following manual testing across Test Suites 1 and 3, two primary categories of defects were logged:

1. **Defects & Broken Flows**:
   - **`BUG-ENV-01`**: `.gitignore` contains `Assets/` without a leading slash, preventing Windows Git from tracking `public/assets/` containing brand assets (`logo_svg.svg`, `bg2.png`). This caused 404s and broken headers on landing, login, and all dashboard pages.
   - **`BUG-IAM-06`**: Calling Client Component exports (`formatToINR` and `toDDMMYYYY`) directly from Next.js 15 Server Components (`app/admin/page.tsx`, `app/admin/trips/page.tsx`, `app/admin/trips/[id]/page.tsx`) crashed the admin suite with a fatal runtime error.
   - **`BUG-IAM-01` / `BUG-IAM-03`**: The Admin Registration form lacked India phone input (`+91` default & country picker via `<IndiaPhoneInput />`) and permitted weak passwords (only length was checked).
   - **`BUG-IAM-02` / `BUG-IAM-04`**: Duplicate email signups redirected incorrectly to OTP verification rather than displaying an account exists notice; `/register` redirected to login without pre-selecting the register tab.
   - **`BUG-IAM-05` / `BUG-IAM-07`**: Dead links to deleted `/auth/callback` in OTP resend calls; middleware redirected authenticated users on `/login` to `/dashboard`, whose signout button posted to non-existent `/auth/signout`.

2. **Stale / Non-Functional UI Elements (Tester 3)**:
   - **`TC-EMP-04`**: Buttons on `/employee/trips/[id]/coordinator` (*Log Expense*, *Add Events*, *Log Team Arrival*, *Remind Pending Travelers*) were static HTML elements with no click handlers, modal triggers, or state updates.
   - **`TC-EMP-05`**: Buttons on `/employee/documents` (*Select File*, *View File*) lacked file input elements, upload handlers, or document viewer handlers.

---

## 2. Core Model & Remediation Architecture

```
                                  [ User Requests ]
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │                                             │
         [ Auth & IAM Entrypoints ]                    [ Employee & Coordinator ]
         - Fix .gitignore asset masking               - Modal for "Log Expense"
         - <IndiaPhoneInput /> in Register            - Modal for "Add Event"
         - lib/security.ts password check             - Arrival status mutation
         - Pre-select tab via ?tab=register           - Functional <input type="file">
         - Fix /dashboard signout & redirects         - Interactive document previews
                   │                                             │
                   └──────────────────────┬──────────────────────┘
                                          │
                               [ lib/formatters.ts ]
                 Pure Node/Next.js formatting helpers (no 'use client')
                 - formatToINR(val)
                 - toDDMMYYYY(iso)
                 - toISODate(ddmmyyyy)
```

---

## 3. What Is Being Removed

| Item / Code Block | File | Reason |
| :--- | :--- | :--- |
| Case-insensitive root `Assets/` entry | `.gitignore` | Replace with `/Assets/` so `public/assets/` is tracked and served by Next.js |
| Direct imports of formatters from client components | `app/admin/trips/page.tsx`, `app/admin/trips/[id]/page.tsx`, `app/admin/trips/create/page.tsx` | Replace with imports from `@/lib/formatters` to prevent Server Component runtime exceptions |
| Deleted endpoint `/auth/callback` in resend options | `app/verify-email/page.tsx`, `app/login/page.tsx` | Deprecated during OTP-only migration (`ADR-003`); remove `emailRedirectTo: .../auth/callback` |
| Broken `<form action="/auth/signout">` form | `app/dashboard/page.tsx` | Replace with direct client/server sign-out action or redirect authenticated users straight to their role portal |

---

## 4. Proposed Changes

### Phase 1: Assets & Server Component Runtime Fixes
- **`.gitignore`**: Change line 2 from `Assets/` to `/Assets/`. Copy `logo_svg.svg`, `bg2.png`, and `logo_v2.png` into `public/assets/` so brand assets load with HTTP 200.
- **`lib/formatters.ts`**: Verify complete implementation of `formatToINR`, `toDDMMYYYY`, and `toISODate`.
- **`app/admin/trips/page.tsx`** & **`app/admin/trips/[id]/page.tsx`**: Update imports to consume `formatToINR` and `toDDMMYYYY` from `@/lib/formatters`.

### Phase 2: IAM & Admin Registration Hardening
- **`app/login/page.tsx`**:
  - Read query param `?tab=register` on mount to activate the **Register Admin** tab.
  - Integrate `<IndiaPhoneInput />` into the Register Admin form, tracking `regPhone` state defaulting to `+91`.
  - Validate password strength using `validatePasswordStrength(regPassword)` from `@/lib/security.ts`.
  - Handle duplicate email signups: if Supabase returns `data.user` with empty `identities` (or existing user error), show inline error `"An account with this email already exists. Please log in."` instead of redirecting to `/verify-email`.
  - Clean up `emailRedirectTo` in unconfirmed resend calls.
- **`app/register/page.tsx`**: Update redirect to `/login?tab=register`.
- **`lib/supabase/middleware.ts` & `app/dashboard/page.tsx`**:
  - Update middleware so authenticated users hitting `/login` or `/register` are redirected to `/admin` or `/employee/dashboard` based on user metadata or profile role, avoiding `/dashboard` intermediary.
  - Update `app/dashboard/page.tsx` sign-out button to execute a clean Supabase client sign-out.
- **`app/verify-email/page.tsx`**: Remove `emailRedirectTo: .../auth/callback` from `supabase.auth.resend`.

### Phase 3: Coordinator Hub Interactivity (`TC-EMP-04`)
- Reference: `docs/designs/coordinator-hub.html`.
- **`app/employee/trips/[id]/coordinator/page.tsx`** (or child client components):
  - **Log Expense**: Implement an interactive modal dialog allowing coordinators to input date (`IndiaDatePicker`), category (Accommodation, Dining, Transport, Misc), vendor, and amount (`RupeeInput`), appending the expense to state.
  - **Add Event**: Implement an itinerary event creation modal with date, time, title, and description inputs, inserting into the shared itinerary.
  - **Log Team Arrival**: Add click handler and state update to toggle arrival status to `"Team Safely Arrived"` with toast feedback.
  - **Remind Pending Travelers**: Add click handler triggering confirmation alert/toast (`"Reminder notifications dispatched to pending travelers"`).

### Phase 4: Employee Documents Management Interactivity (`TC-EMP-05`)
- Reference: `docs/designs/employee-documents.html`.
- **`app/employee/documents/page.tsx`** (or child client components):
  - **Select File**: Attach a hidden `<input type="file" accept=".pdf,.png,.jpg,.jpeg" />` wired to the upload container and "Select File" button. When selected, show file upload progress, simulate or store document record in Supabase `documents` table, and transition state to `pending`.
  - **View File**: Wire the "View File" buttons to open a modal preview displaying file metadata/content or download link.

---

## 5. File Change Summary

| File | Action | Summary of Changes |
| :--- | :---: | :--- |
| `.gitignore` | MODIFY | Anchor `/Assets/` so `public/assets/` is tracked |
| `public/assets/*` | CREATE | Ensure `logo_svg.svg`, `bg2.png` exist in `public/assets` |
| `lib/formatters.ts` | VERIFY / MODIFY | Provide standalone pure string/currency/date formatters |
| `app/admin/trips/page.tsx` | MODIFY | Import formatters from `@/lib/formatters` |
| `app/admin/trips/[id]/page.tsx` | MODIFY | Import formatters from `@/lib/formatters` |
| `app/register/page.tsx` | MODIFY | Redirect to `/login?tab=register` |
| `app/login/page.tsx` | MODIFY | Support `?tab=register`, add `<IndiaPhoneInput />`, validate password strength, handle duplicate email |
| `app/verify-email/page.tsx` | MODIFY | Remove deleted `/auth/callback` redirect in resend handler |
| `lib/supabase/middleware.ts` | MODIFY | Redirect logged-in users directly to their respective portals |
| `app/dashboard/page.tsx` | MODIFY | Fix sign-out action to prevent 404 |
| `app/employee/trips/[id]/coordinator/page.tsx` | MODIFY | Add interactive client modals & actions for expenses, events, arrival check-in, and reminders |
| `app/employee/documents/page.tsx` | MODIFY | Add interactive file picker, upload handler, and modal viewer |

---

## 6. Verification Checklist

1. [ ] **Assets**: Open `http://localhost:3001/login` and verify `logo_svg.svg` and `bg2.png` load with HTTP 200 without broken image icons.
2. [ ] **Admin Sign-In**: Sign in as `admin@tripboard.in` / `Demo@1234` and verify `/admin` renders without server component exceptions.
3. [ ] **Admin Registration**:
   - Navigate to `/register` → confirm it opens with "Register Admin" tab active.
   - Verify Phone Number field defaults to `+91` with country code selector.
   - Enter weak passwords (`12345678`) → verify rejection with explicit requirements.
   - Submit duplicate email `admin@tripboard.in` → verify inline error shown instead of OTP redirect.
4. [ ] **Coordinator Hub**:
   - Log in as `rahul.sharma@tripboard.in`, navigate to Coordinator Hub for assigned trip.
   - Click "Log Expense" → modal opens, submit new expense, updates group expense table.
   - Click "Add Event" → modal opens, submit event, updates itinerary list.
   - Click "Log Team Arrival" → status updates with confirmation banner.
   - Click "Remind Pending Travelers" → dispatch confirmation displayed.
5. [ ] **Documents**:
   - Log in as employee, open `/employee/documents`.
   - Click "Select File" or drag & drop → triggers file chooser, updates doc status.
   - Click "View File" on verified/pending document → renders preview dialog.
