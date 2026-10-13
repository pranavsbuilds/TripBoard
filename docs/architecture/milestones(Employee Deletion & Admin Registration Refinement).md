# Milestones: Employee Deletion & Admin Registration Refinement

Tracks implementation stages for deleting employees (red dustbin icon, confirmation popup modal, database and auth user deletion) and removing the phone number input from the Admin Registration form.

---

## Model Roster & Assignment Heuristics

| Tier / Model | Recommended For |
| :--- | :--- |
| **Claude Sonnet 4.6 (Thinking) / Gemini 3.1 Pro (High)** | Server-side security actions, user deletion via Supabase Auth Admin API, database cascading constraints |
| **Gemini 3.8 Flash (Medium) / Gemini 3.7 Flash** | UI components, modal dialogues, input removals, verification and compilation |

---

## Milestone 1: Server Action for Complete Employee Deletion ✅ Done

- **Recommended Model**: **Claude Sonnet 4.6 (Thinking)** or **Gemini 3.1 Pro (High)**  
  *Rationale*: Involves privileged backend operations using `adminClient.auth.admin.deleteUser`, multi-tenant security verification, and clean database cascade handling across `auth.users`, `public.profiles`, and `public.employees`.

### Files Table
| File | Action | Purpose |
| :--- | :--- | :--- |
| `app/admin/employees/actions.ts` | MODIFY | Added `deleteEmployeeAction(employeeId: string)` with tenant check and auth user deletion |

### Key Implementation Details
1. Validates requesting admin session and verifies employee belongs to admin's `company_id`.
2. Initializes privileged admin client with graceful fallback if service key fails.
3. If `user_id` is linked: deletes auth user via `adminClient.auth.admin.deleteUser(user_id)` — cascades to `public.profiles`.
4. If `user_id` is null (pending invite): falls back to email lookup in `auth.admin.listUsers()` and deletes found user.
5. Auth deletion is non-fatal (warns and continues) — allows cleaning up records even if auth user is already gone.
6. Deletes the `public.employees` row: cascades to `trip_assignments` and `documents`; sets `trips.coordinator_id` to NULL.

### Gate ✅
- [x] `deleteEmployeeAction` checks session and verifies tenant company authorization.
- [x] Deletion removes user from `auth.users` and employee from `public.employees`.
- [x] Server action returns `{ success: boolean, error?: string }`.
- [x] TypeScript typecheck passes with exit code 0 and zero errors.

---

## Milestone 2: Employee Directory Red Dustbin & Confirmation Modal UI ✅ Done

- **Recommended Model**: **Gemini 3.8 Flash (Medium)**  
  *Rationale*: Front-end UI enhancement implementing the exact layout from `docs/designs/employee-delete-and-admin-register-preview.html`.

### Files Table
| File | Action | Purpose |
| :--- | :--- | :--- |
| `app/admin/employees/page.tsx` | MODIFY | Added red dustbin icon button to each employee card, added confirmation popup modal, wired to `deleteEmployeeAction` |

### Key Implementation Details
1. Added red dustbin button to each employee card with hover and scale transitions.
2. Clicking the dustbin opens a confirmation modal showing employee name, code, and permanent deletion warning.
3. Clicking "Yes, Delete Employee" invokes `deleteEmployeeAction` with a loading spinner.
4. On success, removes the deleted employee from the local state array immediately with a success notification.

### Gate ✅
- [x] Red dustbin button is visible and accessible on all employee cards.
- [x] Clicking the dustbin opens the confirmation modal.
- [x] Clicking "Cancel" closes the modal without changes.
- [x] Confirming deletion successfully removes the employee from the UI list.
- [x] TypeScript typecheck passes with exit code 0 and zero errors.

---

## Milestone 3: Remove Phone Number Input from Admin Registration ✅ Done

- **Recommended Model**: **Gemini 3.8 Flash (Medium)**  
  *Rationale*: Front-end form cleanup and state adjustment on the registration screen.

### Files Table
| File | Action | Purpose |
| :--- | :--- | :--- |
| `app/login/page.tsx` | MODIFY | Removed `<IndiaPhoneInput>` from the Admin Register tab; adjusted `handleRegister` |

### Key Implementation Details
1. Removed `regPhone` input `<IndiaPhoneInput>` from the register tab JSX in `app/login/page.tsx`.
2. In `handleRegister`, removed phone metadata requirement while keeping Full Name, Email, Password, Confirm Password.
3. Kept the 4-bar live password strength meter intact.

### Gate ✅
- [x] Admin register tab displays 4 fields: Full Name, Work Email, Password, Confirm Password (no phone input).
- [x] Submitting admin registration succeeds without requiring a phone number.
- [x] TypeScript typecheck passes with exit code 0 and zero errors.

---

## Milestone 4: Verification & Compilation Check ✅ Done

- **Recommended Model**: **Gemini 3.8 Flash (Medium)**  
  *Rationale*: Fast general-purpose check running TypeScript typechecking and production build.

### Files Table
| File | Action | Purpose |
| :--- | :--- | :--- |
| `docs/logs/2026-10-13.md` | MODIFY | Update session log with work completed and verification status |
| `docs/architecture/milestones(Employee Deletion & Admin Registration Refinement).md` | MODIFY | Mark all milestones as completed |

### Gate ✅
- [x] `npm run build` completes with exit code 0 and zero compilation errors across all 18 routes.
- [x] Session log updated in `docs/logs/2026-10-13.md`.

---

## Milestones Summary

| # | Milestone | Status | Model | New Files | Modified Files |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Server Action for Complete Employee Deletion | ✅ Done | Claude Sonnet 4.6 (Thinking) / Gemini 3.1 Pro (High) | 0 | 1 |
| 2 | Employee Directory Red Dustbin & Confirmation Modal UI | ✅ Done | Gemini 3.8 Flash (Medium) | 0 | 1 |
| 3 | Remove Phone Number Input from Admin Registration | ✅ Done | Gemini 3.8 Flash (Medium) | 0 | 1 |
| 4 | Verification & Compilation Check | ✅ Done | Gemini 3.8 Flash (Medium) | 0 | 2 |
