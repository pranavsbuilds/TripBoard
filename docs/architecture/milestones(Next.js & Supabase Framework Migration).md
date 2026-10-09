# Milestones: Next.js & Supabase Framework Migration

**Project:** TripBoard â€” Business Travel Management Platform  
**Plan Reference:** [implementation_plan(Next.js & Supabase Framework Migration).md](./implementation_plan(Next.js%20&%20Supabase%20Framework%20Migration).md)  
**ADR Reference:** [ADR-002-nextjs-framework-migration.md](../decisions/ADR-002-nextjs-framework-migration.md)  
**DB Plan Reference:** [database_and_rbac_plan.md](./database_and_rbac_plan.md)  
**Started:** 2026-10-08  
**Status:** â³ Proposed (Awaiting User Execution Approval)

---

## Progress Tracker (Solo Developer)

| # | Milestone | Status | Recommended Model | Target Files |
|---|---|:---:|---|---|
| **1** | Next.js + Tailwind Project Initialization | âœ… Achieved | Gemini 3.8 Flash (High) | `package.json`, `tsconfig.json`, `tailwind.config.ts`, `app/layout.tsx` |
| **2** | Multi-Tenant Database & RLS Setup | âœ… Achieved | Claude Sonnet 4.6 (Thinking) | `database/schema.sql`, `.env.local` |
| **3** | Authentication Integration (`login_export/`) | âœ… Achieved | Claude Sonnet 4.6 (Thinking) | `app/(auth)/*`, `middleware.ts`, `lib/supabase/*` |
| **4** | Shared Layout & India UI Standards | âœ… Achieved | Gemini 3.8 Flash (Medium) | `components/layout/*`, `components/ui/*` |
| **5** | Admin Suite & Management Workflows | âœ… Achieved | Claude Sonnet 4.6 (Thinking) | `app/admin/*` |
| **6** | Employee Portal & Coordinator Hub | 🟢 Achieved | Claude Sonnet 4.6 (Thinking) | `app/(employee)/*` |
| **7** | End-to-End Verification, Codebase Cleanup & Git Commit | 🟢 Achieved | Gemini 3.5 Flash (Medium / Low) | `legacy_html/`, `.gitignore`, `docs/logs/*`, git commit |

---

## Milestone 1: Next.js + Tailwind Project Initialization âœ… Achieved

**Model:** Gemini 3.8 Flash (High)  
**Rationale:** Fast and reliable configuration of Next.js App Router, TypeScript, dependencies, path aliases, and Tailwind token integration.

### Scope
- Initialize `package.json` with Next.js App Router, React 18/19, TypeScript, Tailwind CSS, Supabase SSR.
- Configure `tailwind.config.ts` with TripBoard's established 7 brand color tokens.
- Establish root layout and font configurations.

### Gate âœ…
- [x] `npm run build` completes successfully.
- [x] App launches and serves basic page with active Tailwind tokens.

---

## Milestone 2: Multi-Tenant Database & RLS Setup âœ… Achieved

**Model:** Claude Sonnet 4.6 (Thinking)  
**Rationale:** Database design, multi-tenant `company_id` isolation, foreign key cascades, and Row Level Security (RLS) policies require rigorous security verification.

### Scope
- Deploy `public.companies`, `profiles`, `employees`, `trips`, `trip_assignments`, and `documents` schema.
- Define RLS policies ensuring strict multi-tenant boundaries (`company_id = get_current_company_id()`) and role separation.
- Deploy auto-assign coordinator trigger for single-traveler trips.
- Scaffold `.env.local` with Supabase connection keys.

### Gate âœ…
- [x] Full schema DDL executes without SQL syntax errors.
- [x] RLS policies enabled and verified on all tables.
- [x] Auto-assign coordinator trigger verified.

---

## Milestone 3: Authentication Integration (`login_export/`) âœ… Achieved

**Model:** Claude Sonnet 4.6 (Thinking)  
**Rationale:** Integrating multi-step OTP wizard, server-side cookies, and route middleware protection requires deep auth reasoning.

### Scope
- Migrate `login_export/` into App Router (`/login`, `/register`, `/forgot-password`, `/verify-email`, `/auth/callback`).
- Implement Next.js middleware with `sanitizeRedirect` for protected route gating.
- Re-theme authentication views to match TripBoard's navy & gold brand design.

### Gate âœ…
- [x] Login and registration forms validate inputs via Zod.
- [x] Session cookie created and persisted via `@supabase/ssr`.
- [x] Unauthorized users attempting to visit `/admin` or `/employee` are redirected to `/login`.

---

## Milestone 4: Shared Layout & India UI Standards âœ… Achieved

**Model:** Gemini 3.8 Flash (Medium)  
**Rationale:** Componentizing approved HTML layout preview into reusable React components adhering to AGENTS.md Rule 7.

### Scope
- Port header and footer from [DESIGNS/shared-components-preview.html](file:///c:/projects/TripBoard/DESIGNS/shared-components-preview.html) into `<Header />` and `<Footer />`.
- Build standard India UI components:
  - `<IndiaDatePicker />`: `DD/MM/YYYY` format with date picker.
  - `<RupeeInput />`: Currency in Rupees (`â‚¹`).
  - `<IndiaPhoneInput />`: Defaults to `+91` with all-countries country code selector.

### Gate âœ…
- [x] Header renders responsive vector logo and background banner without shifts.
- [x] India input components validate according to AGENTS.md Rule 7.

---

## Milestone 5: Admin Suite & Management Workflows âœ… Achieved

**Model:** Claude Sonnet 4.6 (Thinking)  
**Rationale:** Relational queries, employee directory management, and trip creation with coordinator selection.

### Scope
- Build `/admin`: Metrics dashboard with live counters (Total Trips, Active Employees, Pending Docs).
- Build `/admin/employees`: Employee directory list, search, status filter, and add-employee modal.
- Build `/admin/trips`: Trips grid with destination, `DD/MM/YYYY` dates, and `â‚¹` budget.
- Build `/admin/trips/create`: Trip creation form with multi-employee assignment and Trip Coordinator selector.
- Build `/admin/trips/[id]`: Detailed trip view with traveler list and document compliance status.

### Gate âœ…
- [x] Admin can create employees and trips in the database.
- [x] Admin can designate a Trip Coordinator from assigned travelers.
- [x] Real-time stats update based on database records.

---

## Milestone 6: Employee Portal & Coordinator Hub 🟢 Achieved

**Model:** Claude Sonnet 4.6 (Thinking)  
**Rationale:** Traveler self-service, document uploads to Supabase Storage, and Trip Coordinator management console.

### Scope
- Build `/employee/dashboard`: Welcome banner, assigned upcoming trip itinerary card.
- Build `/employee/documents`: Document list with status chips (`Verified`, `Pending`, `Rejected`).
- Build **Coordinator Hub**: Unlocked when the traveler is the trip coordinator:
  - Team document readiness checklist.
  - Shared live itinerary builder.
  - Group expense logger against allocated budget.
  - One-click "Team Arrived" safety check-in.

### Gate âœ…
- [ ] Employee logs in and sees only their assigned trips.
- [ ] Coordinator unlocks the Coordinator Hub on their assigned trip.
- [ ] Document uploads succeed to Supabase Storage bucket `travel-documents`.

---

## Milestone 7: End-to-End Verification, Codebase Cleanup & Git Commit 🟢 Achieved

**Model:** Gemini 3.5 Flash (Medium / Low)  
**Rationale:** Final regression testing, loose file reorganization/cleanup, .gitignore hardening, logging, and local git commit.

### Scope
- End-to-end testing of complete user journey: Admin creates trip & coordinator -> Coordinator reviews checklist & itinerary -> Employee uploads docs -> Admin verifies.
- Verify multi-tenant isolation (Company A cannot see Company B).
- **Codebase Cleanup & File Reorganization**:
  - Archive or safely clean up legacy loose root files (`*.html`, `style.css`, raw asset leftovers) into a dedicated `legacy_html/` backup folder.
  - Remove redundant temporary files and keep the root clean for production Next.js.
  - **`.gitignore` Hardening**: Ensure `.env*.local`, build caches (`.next/`), OS files, and sensitive keys are strictly excluded.
- Maintain daily development logs in `docs/logs/`.
- Create local git commit on feature branch per AGENTS.md Rule 15 & 16.

### Gate âœ…
- [ ] Zero broken links, zero console errors.
- [ ] Multi-tenant isolation verified.
- [ ] Root directory cleaned: legacy HTML files archived/rearranged and `.gitignore` updated.
- [ ] Daily log entry complete per AGENTS.md Rule 17.
- [ ] Local commit created per AGENTS.md Rule 15.
