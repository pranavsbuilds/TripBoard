# Implementation Plan: Admin Workspace Provisioning & Trip Creation Bugfix

Fixes the trip creation crash (`[CreateTrip] [object Object]`), aligns `trip_assignments` database schema, auto-provisions company workspaces for newly registered administrators, and enhances error reporting across Admin forms.

---

## 1. Background & Root Cause Analysis

When a user creates a new administrator account and tries to use the **"Create New Trip"** and **"Add New Employee"** buttons:

1. **New Admin Profile Lacks Tenant Association (`company_id: null`)**:
   - Upon signup, the `handle_new_user` PostgreSQL trigger leaves `company_id` as `NULL`.
   - PostgreSQL RLS policies for `trips` and `employees` require `company_id = public.get_current_company_id()`. Because `company_id` is `null`, newly registered admins cannot view or insert any trips or employees.
2. **Database Schema Mismatch in `trip_assignments`**:
   - `app/admin/trips/create/page.tsx` was attempting to insert `{ company_id, trip_id, employee_id, role, status }`.
   - The actual `public.trip_assignments` table in `database/schema.sql` only has columns: `trip_id`, `employee_id`, `is_coordinator` (boolean), and `assigned_at`. The missing columns cause an immediate PostgreSQL error.
3. **Masked Error Message (`"[object Object]"`)**:
   - Catch block uses `err instanceof Error ? err.message : String(err)`. Supabase returns a `PostgrestError` dictionary, which stringifies to `"[object Object]"` in the console and hides the true database failure.
4. **Invalid `SUPABASE_SERVICE_ROLE_KEY`**:
   - `.env.local` contains a non-Supabase API key (`sk-member-...`) instead of a Supabase JWT service role key. This blocks privileged admin actions like sending invitation emails.

---

## 2. Proposed Architecture & Remediation

```
                         [ Admin Actions ]
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
        [ Trip Creation ]              [ Add Employee ]
                 │                               │
     `app/admin/trips/actions.ts`     `app/admin/employees/actions.ts`
                 │                               │
                 └───────────────┬───────────────┘
                                 │
                   [ ensureAdminCompany Tenant Helper ]
                 - If company_id is null: creates company
                   and updates public.profiles(company_id)
                 - Supports both Service Key & Authenticated RLS
                                 │
                     [ Clean Database Inserts ]
                 - public.trips (with company_id & user.id)
                 - public.trip_assignments (trip_id, employee_id, is_coordinator)
```

---

## 3. What Is Being Changed / Removed

| Item / Code Block | File | Reason |
| :--- | :--- | :--- |
| Client-side direct table insert for trips | `app/admin/trips/create/page.tsx` | Delegate to Server Action `createTripAction` in `app/admin/trips/actions.ts` for clean validation and company tenant verification |
| Invalid columns (`company_id`, `role`, `status`) in `trip_assignments` | `app/admin/trips/create/page.tsx` / `actions.ts` | Replace with `{ trip_id, employee_id, is_coordinator }` matching `schema.sql` |
| `String(err)` error logging masking PostgrestError | `app/admin/trips/create/page.tsx`, `actions.ts` | Extract `.message` or `JSON.stringify(err)` for informative error messages |
| Missing employee empty-state notice | `app/admin/trips/create/page.tsx` | Show clear callout when no company employees exist, directing admin to "Add Employee" first |
| Missing fallback for company creation in `ensureAdminCompany` | `app/admin/employees/actions.ts` | Gracefully fall back to standard authenticated client if `SUPABASE_SERVICE_ROLE_KEY` is not configured |

---

## 4. Detailed Milestones

### Milestone 1: Trip Creation Server Action & Schema Alignment
- Create `app/admin/trips/actions.ts` with `createTripAction`.
- Correct `trip_assignments` payload to `{ trip_id, employee_id, is_coordinator }`.
- Ensure company verification before inserting trips.
- Wire `app/admin/trips/create/page.tsx` to the new Server Action with descriptive error toasts/banners.

### Milestone 2: Admin Tenant Auto-Provisioning & Fallback
- Update `ensureAdminCompany()` in `app/admin/employees/actions.ts` to support both privileged client and authenticated client fallback.
- Export and share `ensureAdminCompany` so `createTripAction` seamlessly auto-provisions a company if a newly signed up admin creates a trip or employee first.
- Add an empty state in `CreateTripPage` when an admin has zero employees registered yet, with a direct link to Add Employee.

### Milestone 3: Verification & Test Run
- Verify trip creation with valid traveler and coordinator assignments.
- Verify error boundary handling when fields are missing.
- Run typecheck and Next.js build to confirm zero compiler errors.
