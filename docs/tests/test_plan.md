# Goal Description
The objective is to establish a comprehensive manual testing strategy and draft detailed test cases for the TripBoard application. The testing focuses on authenticating users (Sign In, Sign Up, Admin Registration, Password Reset), verifying the setup flows for admins and employees, and testing the core business action of starting a trip. Additionally, a major focus is to perform functional feature testing (validating that database states, routing, and access controls work properly) and audit the Admin, Employee, and Coordinator dashboards to identify and report any stale, non-functional, or unresponsive UI elements. The execution will be distributed optimally across 3 available testers.

> [!NOTE] 
> The application uses Next.js with the App Router and Tailwind CSS. As per the project guidelines, all UIs must be tested on both desktop and mobile viewports, and specific India-centric input constraints (DD/MM/YYYY date format, Rupee currency, +91 phone default) must be strictly validated during form testing.

## User Review Required
> [!IMPORTANT]
> Please review the distribution of test suites among the 3 testers to ensure it aligns with your expectations. If you approve of this plan, I will formally export these test cases into a persistent `docs/tests/test_plan.md` artifact within the repository.



## Proposed Changes
Since this is a planning and QA definition phase, no application code will be changed immediately. Once the plan is approved, I will:
1. Save the documented test cases to `docs/test_plan.md` (or similar folder) for the testers to use.
2. Provide a bug report template for the testers to record any "stale or non-functional UI" they discover.

### Test Credentials Setup
Testers should utilize the pre-seeded demo accounts (Global Password: `Demo@1234`) defined in `docs/DEMO_CREDENTIALS.md`:
* **Corporate Admin:** `admin@tripboard.in`
* **Lead Coordinator:** `rahul.sharma@tripboard.in` (Employee with temporary Trip Coordinator role for specific trips)
* **Business Traveler:** `priya.patel@tripboard.in`
* **Traveler (Compliance):** `amit.verma@tripboard.in`

*(Note: The Coordinator role is a contextual role tied to an employee per trip via `trip_assignments.is_coordinator = true`.)*

---

### Test Suite 1: Identity & Access Management (Tester 1)
**Scope:** Sign up, Sign in, Register Admin, Reset Password, General Route Protection.

*   **TC-IAM-01**: **Admin Registration** - Verify a new user can register as an admin using valid details. Ensure the phone number field defaults to `+91` and includes a country code picker.
*   **TC-IAM-02**: **Email Verification** - Verify the user receives a verification email upon registration and can successfully verify their account via the link.
*   **TC-IAM-03**: **Sign In (Valid)** - Verify users can sign in with valid credentials and are redirected to the correct dashboard based on their role.
*   **TC-IAM-04**: **Sign In (Invalid)** - Verify appropriate error messages appear for incorrect email or password.
*   **TC-IAM-05**: **Reset Password (Request)** - Verify the `/forgot-password` flow successfully sends a reset email.
*   **TC-IAM-06**: **Reset Password (Execution)** - Verify the user can change the password using the reset link and subsequently log in with the new password.
*   **TC-IAM-07**: **Route Protection** - Verify an unauthenticated user cannot access `/admin/*` or `/employee/*` routes and is redirected to `/login`.
*   **TC-IAM-08**: **Role-based Access** - Verify an authenticated employee cannot access `/admin/*` routes.

---

### Test Suite 2: Admin Operations & Setup (Tester 2)
**Scope:** Admin Dashboard, Employee Setup, Start Trip, View Trips.

*   **TC-ADM-01**: **Admin Dashboard UI & Data** - Verify the `/admin` dashboard loads correctly, displays accurate summary metrics (matching database state), and contains no stale or non-functional links. 
*   **TC-ADM-02**: **Add Employee Feature** - Verify an admin can create a new employee profile via `/admin/employees/add`. Verify the new employee is persisted to the database and appears in the list. Ensure phone inputs default to `+91`.
*   **TC-ADM-03**: **View & Edit Employees** - Verify the list of employees is displayed correctly in `/admin/employees`. Test any edit/delete functionality if present to ensure data is updated accurately.
*   **TC-ADM-04**: **Start Trip Feature** - Verify an admin can create a new trip via `/admin/trips/create`. **CRITICAL Feature Test:** Verify the trip saves correctly to the database, is assigned to the selected employees, and the designated coordinator is correctly flagged. Ensure the `IndiaDatePicker` is used (`DD/MM/YYYY`), and cost fields use the `RupeeInput` component.
*   **TC-ADM-05**: **View Trips** - Verify created trips are listed correctly in `/admin/trips` and the details view `/admin/trips/[id]` accurately reflects the created trip's data.
*   **TC-ADM-06**: **Responsive Design** - Verify the Admin Dashboard and all admin forms are fully functional and properly laid out on a mobile viewport.

---

### Test Suite 3: Employee & Coordinator Workflows (Tester 3)
**Scope:** Employee First Login, Employee Dashboard, Coordinator Dashboard, Document/Trip Interactions.

*   **TC-EMP-01**: **Employee Setup/Login** - Verify an employee created by an admin can log in successfully and access the employee portal.
*   **TC-EMP-02**: **Employee Dashboard UI & Data** - Verify the `/employee/dashboard` loads without errors, showing only assigned trips, with no stale UI elements.
*   **TC-EMP-03**: **View Assigned Trip Feature** - Verify an employee can view details of a trip assigned to them at `/employee/trips/[id]`. Verify they cannot access trips they are not assigned to.
*   **TC-EMP-04**: **Coordinator Dashboard Feature** - Navigate to `/employee/trips/[id]/coordinator` as a coordinator (`rahul.sharma@tripboard.in`). Verify they have elevated visibility over co-travelers and budget tracking compared to a regular traveler. Verify regular travelers cannot access this view.
*   **TC-EMP-05**: **Documents Management Feature** - Verify employees can upload documents at `/employee/documents`. Verify the file is successfully stored and the status reflects as "pending" or "verified" correctly.
*   **TC-EMP-06**: **Responsive Design** - Verify the Employee and Coordinator views work perfectly on mobile screens.

## Verification Plan

### Manual Verification
The 3 testers will manually execute the test cases outlined in the suites above. 
Testers should report bugs using the following format for consistency:
1. **Title:** [Component/Page] Brief description of the issue.
2. **Steps to Reproduce:** Numbered list of actions taken.
3. **Expected Behavior:** What should have happened.
4. **Actual Behavior:** What actually happened (e.g., stale UI, unhandled error, incorrect date format).
5. **Environment:** Desktop / Mobile (specify browser/device).

Once the manual testing phase is complete, the development team will review the bug reports, fix the stale UI/functional bugs, and the testers will perform a re-test.
