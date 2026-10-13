# Milestones: Post-QA Bug Remediation & Feature Completion

Execution map with assigned models, scoped files, and verification gates for remediating defects from Test Suite 1 (IAM) and Test Suite 3 (Employee & Coordinator Workflows).

---

## Milestone 1: Asset Recovery & Server Component Runtime Fixes
- **Recommended Model:** `Gemini 3.7 Flash (Medium)` (Fast utility refactoring & gitignore configuration)
- **Files Table:**

| File | Action | Description |
| :--- | :---: | :--- |
| `.gitignore` | MODIFY | Anchor `/Assets/` so `public/assets/` is tracked |
| `public/assets/logo_svg.svg` | CREATE | Copy from `docs/designs/Assets/logo_svg.svg` |
| `public/assets/bg2.png` | CREATE | Copy from `docs/designs/Assets/bg2.png` |
| `public/assets/logo_v2.png` | CREATE | Copy from `docs/designs/Assets/logo_v2.png` |
| `lib/formatters.ts` | CREATE / MODIFY | Standalone pure Node/Next.js formatting helpers |
| `components/ui/IndiaDatePicker.tsx` | MODIFY | Re-export helpers from `lib/formatters` |
| `components/ui/RupeeInput.tsx` | MODIFY | Re-export helpers from `lib/formatters` |
| `app/admin/page.tsx` | MODIFY | Import formatters from `@/lib/formatters` |
| `app/admin/trips/page.tsx` | MODIFY | Import formatters from `@/lib/formatters` |
| `app/admin/trips/[id]/page.tsx` | MODIFY | Import formatters from `@/lib/formatters` |
| `components/trips/EmployeeTripCard.tsx` | MODIFY | Import formatters from `@/lib/formatters` |

- **Key Implementation Details:**
  Ensure zero `'use client'` dependencies in server components when formatting INR currency and DD/MM/YYYY dates.
- **Gate ✅:**
  - [x] `git status` shows `public/assets` tracked.
  - [x] `http://localhost:3001/login` displays brand logo and background without 404 errors.
  - [x] Logging in as `admin@tripboard.in` cleanly opens `/admin`, `/admin/trips`, and `/admin/trips/[id]` without server runtime crashes.
  - [x] `npx tsc --noEmit` runs with 0 errors.

---

## Milestone 2: IAM & Admin Registration Hardening
- **Recommended Model:** `Gemini 3.1 Pro (High)` / `Claude Sonnet 4.6 (Thinking)` (Security, validation rules, auth flows)
- **Files Table:**

| File | Action | Description |
| :--- | :---: | :--- |
| `app/register/page.tsx` | MODIFY | Redirect to `/login?tab=register` |
| `app/login/page.tsx` | MODIFY | Support `?tab=register`, add `<IndiaPhoneInput />`, check `validatePasswordStrength()`, handle duplicate email error |
| `app/verify-email/page.tsx` | MODIFY | Remove deleted `/auth/callback` option from `supabase.auth.resend` |
| `lib/supabase/middleware.ts` | MODIFY | Redirect authenticated visitors directly to `/admin` or `/employee/dashboard` |
| `app/dashboard/page.tsx` | MODIFY | Replace `<form action="/auth/signout">` with client sign-out action |

- **Key Implementation Details:**
  - Enforce password strength through `validatePasswordStrength(password)` from `lib/security.ts`.
  - Admin phone input must default to `+91` with country code selector, complying with Rule 7.
- **Gate ✅:**
  - [x] Accessing `/register` automatically displays the "Register Admin" tab.
  - [x] Phone input is visible on admin registration with `+91` selected.
  - [x] Passwords without letters or numbers are rejected with an explicit error message.
  - [x] Duplicate registration attempts on existing emails display `"An account with this email already exists"`.
  - [x] Already authenticated users accessing `/login` are routed to their role portal without 404 signout errors.

---

## Milestone 3: Coordinator Hub Interactivity (`TC-EMP-04`)
- **Recommended Model:** `Gemini 3.7 Flash (Medium)` (Interactive UI matching `docs/designs/coordinator-hub.html`)
- **Files Table:**

| File | Action | Description |
| :--- | :---: | :--- |
| `app/employee/trips/[id]/coordinator/page.tsx` | MODIFY | Provide client state/modals for actions |
| `components/coordinator/ExpenseModal.tsx` | CREATE | Interactive expense logger dialog |
| `components/coordinator/EventModal.tsx` | CREATE | Interactive itinerary event creation dialog |
| `components/coordinator/CoordinatorHubClient.tsx` | CREATE | Interactive client component for Coordinator Hub |

- **Key Implementation Details:**
  Match `docs/designs/coordinator-hub.html` visually. Provide live feedback upon clicking "Log Team Arrival" and "Remind Pending Travelers".
- **Gate ✅:**
  - [x] Log in as `rahul.sharma@tripboard.in` and open Coordinator Hub.
  - [x] Click "Log Expense" -> Dialog opens, submitting adds new entry to expense table.
  - [x] Click "Add Event" -> Dialog opens, submitting adds event to itinerary.
  - [x] Click "Log Team Arrival" -> Status indicator turns to safely arrived.
  - [x] Click "Remind Pending Travelers" -> Feedback alert appears.

---

## Milestone 4: Employee Travel Documents Interactivity (`TC-EMP-05`)
- **Recommended Model:** `Gemini 3.7 Flash (Medium)` (File upload UI matching `docs/designs/employee-documents.html`)
- **Files Table:**

| File | Action | Description |
| :--- | :---: | :--- |
| `app/employee/documents/page.tsx` | MODIFY | Enable client interaction for file selection and preview |
| `components/documents/DocumentViewerModal.tsx` | CREATE | Document preview modal dialog |
| `components/documents/EmployeeDocumentsClient.tsx` | CREATE | Interactive client component for Documents |

- **Key Implementation Details:**
  Trigger native file selector on click of "Select File" or dropzone. When a file is selected, update document state to `pending` review.
- **Gate ✅:**
  - [x] Log in as an employee, navigate to `/employee/documents`.
  - [x] Click "Select File" -> Native file picker opens.
  - [x] Selecting a file updates the document item state to "Pending Review".
  - [x] Click "View File" on any document -> Preview modal displays file details.

---

## Milestone 5: Full Regression Run & QA Verification Sign-Off
- **Recommended Model:** `Gemini 3.1 Pro (High)`
- **Files Table:**

| File | Action | Description |
| :--- | :---: | :--- |
| `docs/logs/2026-10-11.md` | CREATE | Document completed bug remediation and validation details |

- **Key Implementation Details:**
  Execute end-to-end regression tests across all fixed items from Test Suites 1 & 3 in both desktop and mobile views.
- **Gate ✅:**
  - [x] All 7 bugs from Test Suite 1 (`BUG-IAM-01` through `BUG-IAM-07`) verified fixed.
  - [x] All 3 issues from Test Suite 3 (`BUG-ENV-01`, `TC-EMP-04`, `TC-EMP-05`) verified fixed.
  - [x] Project builds cleanly via `npm run build` or `npx tsc --noEmit`.

---

## Summary Table

| # | Milestone | Status | Recommended Model | New Files | Modified Files |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **1** | Asset Recovery & Server Component Runtime Fixes | ✅ Done | Gemini 3.7 Flash | 4 | 7 |
| **2** | IAM & Admin Registration Hardening | ✅ Done | Gemini 3.1 Pro (High) / Claude Sonnet | 0 | 5 |
| **3** | Coordinator Hub Interactivity (`TC-EMP-04`) | ✅ Done | Gemini 3.7 Flash | 3 | 1 |
| **4** | Employee Travel Documents Interactivity (`TC-EMP-05`) | ✅ Done | Gemini 3.7 Flash | 2 | 1 |
| **5** | Full Regression Run & QA Sign-Off | ✅ Done | Gemini 3.1 Pro (High) | 1 | 0 |
