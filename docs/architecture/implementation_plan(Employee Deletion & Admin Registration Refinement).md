# Implementation Plan: Employee Deletion & Admin Registration Refinement

Implements complete employee deletion (with red dustbin icon and confirmation modal popup) spanning Supabase Auth user deletion and company directory cascade removal, and refines the Admin Registration form by removing the phone number input.

---

## 1. Background & Objectives

1. **Employee Deletion Flow**:
   - Admins need the ability to permanently offboard an employee from the company travel portal.
   - Requires a distinct **red dustbin icon** on each employee card in the Employee Directory (`/admin/employees`).
   - Requires a **confirmation popup modal** detailing the permanent consequences of deletion.
   - Requires **complete backend deletion**:
     - Deletes the associated user from `auth.users` via Supabase Admin API (so they can no longer log in).
     - Deletes the employee record from `public.employees` (which cascades to `trip_assignments` and travel `documents`).
     - Cleans up any orphaned record in `public.profiles`.
2. **Admin Registration Refinement**:
   - The user requested: *"keep the register admin & remove the phone number input"*.
   - Removes the phone number input from the Admin Registration tab in `app/login/page.tsx`.
   - Admin registration continues with: Full Name, Work Email, Password (with live 4-bar strength meter), Confirm Password.

---

## 2. Design Reference & UI Gate (Rule 3)

The visual specification and interactive behavior have been created in:
- [`docs/designs/employee-delete-and-admin-register-preview.html`](file:///c:/Users/Parth/OneDrive/Desktop/what/ParthTrip/docs/designs/employee-delete-and-admin-register-preview.html)

No UI code will be edited until this design preview is explicitly approved by the user.

---

## 3. What Is Being Removed vs. New vs. Modified

| Category | Item | File | Reason |
| :--- | :--- | :--- | :--- |
| **REMOVAL** | `<IndiaPhoneInput>` in Admin Registration | `app/login/page.tsx` | User requirement: remove phone number input during admin signup |
| **REMOVAL** | `regPhone` state & metadata requirement | `app/login/page.tsx` | Phone is no longer collected on admin registration form |
| **NEW** | `deleteEmployeeAction(employeeId)` Server Action | `app/admin/employees/actions.ts` | Authenticated server action to permanently delete employee from `auth.users`, `public.employees`, and `public.profiles` |
| **NEW** | Red dustbin icon button | `app/admin/employees/page.tsx` | Clear, accessible red action button on each employee card |
| **NEW** | Confirmation popup modal | `app/admin/employees/page.tsx` | Prevents accidental deletion; confirms employee name and code with warning callout |
| **MODIFIED** | Admin Registration Form Layout | `app/login/page.tsx` | Clean 4-field layout (Name, Email, Password, Confirm Password) |

---

## 4. Architecture & Deletion Data Flow

```
                      [ Admin Clicks Red Dustbin ]
                                   │
                     [ Confirmation Modal Popup ]
                      (Employee Name, Code, Warnings)
                                   │  Admin Confirms
                                   ▼
             `deleteEmployeeAction(employeeId)` (Server Action)
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
     1. Tenant Validation                      2. Auth User Lookup
  Verify employee belongs to               Find employee.user_id or
   admin's active company_id                auth user matching email
              │                                         │
              ├─────────────────────────────────────────┤
              ▼                                         ▼
   3. Delete from `auth.users`               4. Delete from `employees`
   `adminClient.auth.admin.deleteUser`        `dbClient.from('employees').delete()`
   (Revokes login access &                   (Cascades to trip_assignments,
    cascades public.profiles)                 documents; sets trips.coordinator
                                               to NULL)
```
