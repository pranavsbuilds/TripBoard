# ADR-002: Next.js (App Router) + Supabase (PostgreSQL) Architecture Migration

**Date:** 2026-10-08  
**Status:** Accepted  
**Deciders:** Arpita Shelke, TripBoard Development Team  

---

## 1. Context

TripBoard is transitioning from static HTML prototype mockups to a functional, secure business travel management platform. The application requires:
1. **Database Engine Selection**:
   - The platform needs relational integrity (companies, employees, trips, assignments, travel documents), foreign key cascades, and check constraints (`start_date <= end_date`, `budget >= 0`).
   - Need for multi-tenant isolation so companies cannot view or modify each other's data.
   - Built-in file storage for travel documents (passports, visas, flight tickets).
2. **User Authentication & Multi-Role Access Control**:
   - Three distinct operational permissions:
     - **Admin**: Company HR/Travel Manager with full company-level CRUD, budget controls, and document verification.
     - **Employee**: Business traveler with personal assigned trip view and document upload.
     - **Trip Coordinator**: A trip-scoped contextual role assigned to one traveler per trip (auto-assigned if 1 traveler) to manage shared itineraries, group expenses, document compliance checks, and team check-ins.
3. **Multi-Developer vs Solo Velocity (Same-Day Delivery)**:
   - A single developer owns all layers end-to-end.
   - An existing standalone package `login_export/` is already implemented specifically for **Next.js App Router + Supabase Auth + Zod**.
4. **India-Specific Standards (AGENTS.md Rule 7)**:
   - `DD/MM/YYYY` date format and calendar picker.
   - Rupee currency (`₹`) formatting.
   - `+91` default phone number formatting with full country-code selector.

---

## 2. Decision

**Adopt Next.js (App Router) with TypeScript, Supabase PostgreSQL, and Tailwind CSS as TripBoard's core framework.**

### Core Components:
- **Database Engine:** **PostgreSQL** (Relational SQL hosted via Supabase).
  - Explicitly chosen over NoSQL (MongoDB/Firestore) and MySQL due to native **Row Level Security (RLS)**, transactional integrity, foreign key cascades, and SQL triggers.
- **Multi-Tenancy Key:** Every core entity is strictly partitioned by **`company_id`** foreign key referencing `public.companies(id)`.
- **Framework:** Next.js 14/15 App Router with React Server Components (RSC) and Server Actions.
- **Language:** TypeScript for end-to-end type safety.
- **Styling:** Tailwind CSS v3 using established brand tokens (`primary-dark: #071D3A`, `brand-blue: #2E5BFF`, `gold-btn: #C9A227`, `bg-ice: #EAF5FC`).
- **Authentication Base:** Direct integration of the verified `login_export/` drop-in module with `@supabase/ssr` cookies and PKCE OAuth.

---

## 3. Database Schema & Multi-Tenancy Architecture

```
                       +-------------------+
                       | public.companies  |
                       |-------------------|
                       | id (UUID, PK)     |
                       | name (TEXT)       |
                       | domain (TEXT)     |
                       +-------------------+
                                 │
           ┌─────────────────────┼─────────────────────┐
           │ 1:N                 │ 1:N                 │ 1:N
           ▼                     ▼                     ▼
 +-------------------+ +-------------------+ +-------------------+
 |  public.profiles  | | public.employees  | |   public.trips    |
 |-------------------| |-------------------| |-------------------|
 | id (UUID, PK)     | | id (UUID, PK)     | | id (UUID, PK)     |
 | company_id (UUID) | | company_id (UUID) | | company_id (UUID) |
 | role (admin/emp)  | | user_id (UUID)    | | coordinator_id(FK)|
 +-------------------+ +-------------------+ +-------------------+
                                 │                     │
                                 │ 1:N                 │ 1:N
                                 ▼                     ▼
                       +-----------------------------------+
                       |     public.trip_assignments       |
                       |-----------------------------------|
                       | trip_id (FK)                      |
                       | employee_id (FK)                  |
                       | is_coordinator (BOOLEAN)          |
                       +-----------------------------------+
                                 │
                                 │ 1:N
                                 ▼
                       +-----------------------------------+
                       |         public.documents          |
                       |-----------------------------------|
                       | id, employee_id, trip_id          |
                       | document_type, file_url, status   |
                       +-----------------------------------+
```

---

## 4. Role-Based Access Control (RBAC) Specification

| Role | Scope | Key Capabilities |
|---|---|---|
| **Admin** | Company-Wide (`company_id`) | • Full CRUD on company employees and trips.<br>• Allocate budgets in ₹.<br>• Verify or reject uploaded travel documents.<br>• Assign travelers and designate Trip Coordinators. |
| **Trip Coordinator** | Trip-Specific (`coordinator_id = employee_id`) | • View document readiness checklist for all team members on assigned trip.<br>• Build & edit live shared itinerary.<br>• Log group expenses against trip budget.<br>• Perform safety / "Arrived Safely" team check-in.<br>• Automatically designated if trip has only 1 traveler. |
| **Employee** | Personal (`user_id = auth.uid()`) | • View personal profile and assigned trips.<br>• Upload personal travel documents (passports, visas, tickets).<br>• View live trip itinerary and verification status. |

---

## 5. Alternatives Considered

| Alternative | Pros | Cons & Why Rejected |
|---|---|---|
| **NoSQL (MongoDB / Firestore)** | Flexible schema, document storage | Lacks native Row Level Security (RLS) enforcement at the database level; relational joins between companies, trips, assignments, and documents require costly manual client-side lookups or nested denormalization; high risk of multi-tenant data leaks. |
| **MySQL + Express API** | Relational SQL, widely known | Lacks built-in RLS policies (must write custom tenancy checks in every endpoint); requires separate Auth and Storage servers; cannot leverage pre-built `login_export/` Supabase module. |
| **Vanilla Node.js / Express + EJS** | Simple initial setup | No component reuse, manual DOM handling, slow velocity, unable to meet same-day delivery mandate. |

---

## 6. Consequences

### Positive
1. **Engine-Level Security**: PostgreSQL RLS ensures that queries automatically filter by `company_id = get_current_company_id()`, making cross-company data leakage mathematically impossible.
2. **Contextual Coordinator Power**: Trip coordinator features enhance traveler collaboration without requiring a clumsy separate global account type.
3. **Unified Full-Stack Velocity**: Next.js App Router and Server Actions allow a single developer to build server-rendered, secure, responsive views in record time.

### Negative & Mitigation
- **Complex RLS Policy Rules**: Mitigated by providing clear, tested `security definer` helper functions (`is_admin()`, `get_current_company_id()`, `is_trip_coordinator()`).

---

## 7. References
- [TripBoard AGENTS.md](file:///c:/projects/TripBoard/AGENTS.md) (Rules 7, 8, 11, 16, 19)
- [login_export/README.md](file:///c:/projects/TripBoard/login_export/README.md)
- [ADR-001: Tailwind CSS Migration](file:///c:/projects/TripBoard/docs/decisions/ADR-001-tailwind-css-migration.md)
