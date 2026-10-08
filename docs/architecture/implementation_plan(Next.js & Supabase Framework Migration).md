# Implementation Plan: Next.js & Supabase Framework Migration

A comprehensive, production-grade roadmap to migrate TripBoard from static HTML prototypes to a fully functional **Next.js (App Router) + TypeScript + Supabase (PostgreSQL) + Tailwind CSS** platform, enabling same-day delivery of Multi-Tenant Authentication, Database CRUD, and the Trip Coordinator role.

---

## 1. Background & Migration Objectives

TripBoard currently has 12 static HTML mockups styled with shared Tailwind CSS chrome and monolithic `style.css` content. To fulfill the same-day delivery mandate for a functional database, authentication, and backend architecture, this plan establishes:

1. **Framework Modernization**: Initialize Next.js 14/15 App Router with TypeScript and native Tailwind CSS support.
2. **Database Engine**: **PostgreSQL** (hosted via Supabase), leveraging relational foreign keys, check constraints, and native Row Level Security (RLS).
3. **Multi-Tenancy (`company_id`)**: Partition all enterprise data (`profiles`, `employees`, `trips`) under `public.companies` to guarantee multi-tenant security.
4. **Three-Tier Access Model**:
   - **Admin**: Full company-level travel management, employee directory CRUD, budget allocation, document verification.
   - **Trip Coordinator**: A trip-level contextual role (auto-assigned if 1 traveler) to coordinate team document readiness, shared live itineraries, group expenses, and safety check-ins.
   - **Employee**: Individual traveler self-service portal, assigned trip itinerary, and travel document uploads.
5. **Auth Integration**: Incorporate the pre-built, production-ready `login_export/` package (`@supabase/ssr`, Zod validation, 4-step password recovery wizard, OTP verification).
6. **Solo Developer Delivery (AGENTS.md Rule 16)**: A single developer implements and tests all layers sequentially across the stack.
7. **India-Specific Standards (AGENTS.md Rule 7)**:
   - `DD/MM/YYYY` date format and calendar picker.
   - Rupee currency (`₹`) for budgets and expenses.
   - `+91` default phone number with country-code picker.

---

## 2. Architecture & Route Mapping

```
+-----------------------------------------------------------------------------------------+
|                                TripBoard App Architecture                               |
+-----------------------------------------------------------------------------------------+
                                             │
            ┌────────────────────────────────┴───────────────────────────────┐
            ▼                                                                ▼
+-------------------------------+                               +-------------------------------+
|     Public / Auth Routes      |                               |       Protected Portals       |
+-------------------------------+                               +-------------------------------+
| /                   (Landing) |                               | Middleware: Role, Session &   |
| /login              (Sign In) |                               |             company_id Guard  |
| /register           (Sign Up) |                               +---------------+---------------+
| /forgot-password    (OTP flow)|                                               │
| /verify-email       (Confirm) |                       ┌───────────────────────┴───────────────────────┐
+-------------------------------+                       ▼                                               ▼
                                        +-------------------------------+       +-------------------------------+
                                        |          Admin Suite          |       |        Employee Portal        |
                                        +-------------------------------+       +-------------------------------+
                                        | /admin             (Dashboard)|       | /employee/dashboard   (Portal)|
                                        | /admin/employees   (Directory)|       | /employee/documents   (Upload)|
                                        | /admin/employees/add          |       | /employee/trips       (View)  |
                                        | /admin/trips       (Grid)     |       +---------------+---------------+
                                        | /admin/trips/create(Assign &  |                       │
                                        |             Pick Coordinator) |                       ▼ (If Coordinator)
                                        | /admin/trips/[id]  (Details)  |       +-------------------------------+
                                        +-------------------------------+       |     Coordinator Hub Console   |
                                                                                +-------------------------------+
                                                                                | • Team Document Checklist     |
                                                                                | • Shared Live Itinerary       |
                                                                                | • Group Expense Logger        |
                                                                                | • "Team Arrived" Check-In     |
                                                                                +-------------------------------+
```

---

## 3. Database Schema Specification (PostgreSQL)

See complete DDL, helper functions, and RLS policies in **[docs/architecture/database_and_rbac_plan.md](./database_and_rbac_plan.md)**:
- `public.companies`: Multi-tenant organization entity.
- `public.profiles`: User profile tied 1:1 to `auth.users`, stamped with `company_id` and `role`.
- `public.employees`: Company directory records, stamped with `company_id`.
- `public.trips`: Business travel itineraries with `budget_inr`, `start_date`, `end_date`, stamped with `company_id` and `coordinator_id`.
- `public.trip_assignments`: Many-to-many link with `is_coordinator` flag.
- `public.documents`: Travel documents with verification statuses (`pending`, `verified`, `rejected`).

---

## 4. Phased Milestone Execution Map (Solo Developer)

### Milestone 1: Next.js + Tailwind Project Initialization
- **Goal:** Initialize Next.js App Router project in the repository with TypeScript and Tailwind CSS configuration matching existing brand tokens.
- **Tasks:**
  - Create `package.json` with Next.js, React, `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `lucide-react`.
  - Configure `tsconfig.json` with `@/*` path aliases.
  - Port `tailwind.config.ts` with established TripBoard tokens (`primary-dark`, `primary-blue`, `brand-blue`, `bg-ice`, `accent-gold`, `gold-btn`, etc.).
  - Set up root layout with fonts and metadata.
- **Gate ✅:** `npm run build` passes; landing page placeholder loads on `localhost:3000`.

### Milestone 2: Multi-Tenant Supabase Database Setup
- **Goal:** Deploy PostgreSQL tables, helper functions, and multi-tenant RLS policies.
- **Tasks:**
  - Execute PostgreSQL DDL from `docs/architecture/database_and_rbac_plan.md` in Supabase.
  - Test helper functions: `is_admin()`, `get_current_company_id()`, `is_trip_coordinator()`.
  - Setup `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Gate ✅:** DDL applies cleanly; RLS policies verify without errors.

### Milestone 3: Authentication Integration (`login_export/`)
- **Goal:** Integrate full Supabase authentication into App Router with role and company resolution.
- **Tasks:**
  - Move `login_export/app/login`, `register`, `forgot-password`, `verify-email`, `auth/callback` to Next.js routes.
  - Move `login_export/lib/supabase/*` and session helpers to `lib/supabase/`.
  - Implement Next.js auth middleware for role and `company_id` route gating.
  - Restyle login/register containers using TripBoard Tailwind palette and header branding.
- **Gate ✅:** User can sign up, log in with session cookies, reset password via OTP, and receive role-based redirection.

### Milestone 4: Shared Layout & India UI Standards
- **Goal:** Componentize approved HTML layout preview into reusable React components adhering to AGENTS.md Rule 7.
- **Tasks:**
  - Port header and footer from `DESIGNS/shared-components-preview.html` into `<Header />` and `<Footer />`.
  - Build standard India UI components:
    - `<IndiaDatePicker />`: `DD/MM/YYYY` format with date picker.
    - `<RupeeInput />`: Currency in Rupees (`₹`).
    - `<IndiaPhoneInput />`: Defaults to `+91` with all-countries country code selector.
- **Gate ✅:** Shared layout components match approved preview; India inputs format properly.

### Milestone 5: Admin Suite & Management Workflows
- **Goal:** Fully functional Admin dashboard, company employee directory, and trip creation.
- **Tasks:**
  - `/admin`: Real-time KPI stat counters (Total Trips, Active Travelers, Pending Docs).
  - `/admin/employees`: Searchable employee table, filter by status, and add-employee form with `+91` phone validation.
  - `/admin/trips`: Trips grid with destination, dates (`DD/MM/YYYY`), budget in `₹`, and status chips.
  - `/admin/trips/create`: Multi-employee assignment selector with Trip Coordinator dropdown (auto-selected if 1 traveler).
  - `/admin/trips/[id]`: Trip details view with traveler list and document compliance status.
- **Gate ✅:** Admin can create employees, create trips, assign travelers, and designate coordinators.

### Milestone 6: Employee Portal & Trip Coordinator Hub
- **Goal:** Traveler self-service portal, document uploads, and Trip Coordinator management console.
- **Tasks:**
  - `/employee/dashboard`: Personalized welcome card, upcoming trip itinerary card.
  - `/employee/documents`: Document upload drop zone (passports, tickets, visas), status indicator chips (`Pending`, `Verified`, `Rejected`).
  - **Coordinator Console**: If user is the designated coordinator on the trip:
    - View document readiness checklist for all team members.
    - Live shared itinerary builder.
    - Group expense logger against `budget_inr`.
    - Safety "Team Arrived" check-in button.
- **Gate ✅:** Regular employee sees their trip and uploads docs; Coordinator unlocks the Coordinator Hub.

### Milestone 7: End-to-End Verification, Dev Log & Git Commit
- **Goal:** Complete regression testing, security review, and version control commit.
- **Tasks:**
  - Verify complete user journey: Admin creates trip & coordinator -> Coordinator reviews checklist & itinerary -> Employee uploads docs -> Admin verifies.
  - Verify multi-tenant isolation (Company A cannot see Company B).
  - Verify India-specific standards across all inputs.
  - Update `docs/logs/2026-10-08.md`.
  - Create local git commit on feature branch.
- **Gate ✅:** End-to-end functionality verified; dev log created; clean git commit recorded.
