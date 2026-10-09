# TripBoard

> **Corporate Travel Management. Simplified.**

TripBoard is a modern, enterprise-grade business travel and compliance management platform built with **Next.js 15 (App Router)**, **Tailwind CSS**, and **Supabase (PostgreSQL, Auth, Storage, and Row-Level Security)**.

Designed for modern distributed teams, TripBoard streamlines corporate travel workflows—from multi-traveler trip creation and dual-budget allocation (Group Bookings vs. Individual Per-Diem Allowance) to employee document verification and dedicated on-ground Trip Coordinator hubs.

---

## 🚀 Key Features

### 🏢 Multi-Tenant Security & Role-Based Access Control (RBAC)
- **Enterprise Isolation:** All tenant data strictly partitioned by `company_id` via PostgreSQL Row-Level Security (RLS) policies.
- **Dual Roles:**
  - **Admin:** Manages company profile, employee directory, trip approvals, and document compliance.
  - **Employee:** Views assigned trips, monitors document status, uploads travel proofs, and logs receipts.
- **Dynamic Coordinator Assignment:** Any traveling employee can be designated as the **Trip Coordinator** for a specific trip, unlocking the on-ground Coordinator Hub.

### 💼 Admin Management Suite (`/admin`)
- **Real-Time KPIs:** Live counts of active trips, upcoming trips, total employees, and cumulative allocated corporate travel budget in INR.
- **Employee Directory (`/admin/employees`):** Real-time search by employee name, email, employee ID, and department, with status filters (`Active`, `On Trip`).
- **Add Employee Workflow (`/admin/employees/add`):** Integrated with India UI standards (defaulting to `+91` phone numbers with country picker and `DD/MM/YYYY` date pickers).
- **Dual-Budget Trip Creation (`/admin/trips/create`):**
  - Multi-select travelers from the directory.
  - Designate a **Trip Coordinator** (⭐ badge).
  - Separate inputs for **Group Budget (₹)** (flights/hotels managed by coordinator) and **Individual Budget (₹)** (per-diem allowance).
  - Automatic calculation of **Total Approved Budget** = $\text{Group Budget} + (\text{Individual Budget} \times N)$.
- **Compliance & Roster Verifier (`/admin/trips/[id]`):** Traveler list with real-time passport, visa, ticket, and insurance verification workflows.

### ✈️ Employee Portal (`/employee/dashboard`)
- **Upcoming Trips:** Interactive trip cards with dual progress bars comparing Group Bookings vs. Personal Per-Diem spending.
- **Smart Alerts:** Action-required banners alerting travelers of pending or missing travel documents.
- **My Documents (`/employee/documents`):** Centralized hub tracking mandatory document compliance (Passport, Visa, Flight Ticket, Hotel Reservation, Travel Insurance).

### ⭐ Trip Coordinator Hub (`/employee/trips/[id]/coordinator`)
- **Exclusive Lead Console:** Automatically unlocked for the designated trip coordinator.
- **Team Readiness Tracker:** Live checklist tracking verification readiness across all travelers in the group.
- **Group Expense Logger:** Track group booking costs directly against the allocated Group Budget.
- **Safety Check-in:** Log team arrival status upon landing.
- **Shared Itinerary Builder:** Schedule flight departures, hotel check-ins, and team activities.

### 🇮🇳 India-Specific Standards
- **Currency:** Indian Rupee (`₹`) with comma formatting (e.g., `₹1,50,000`).
- **Dates:** Strictly formatted as `DD/MM/YYYY`.
- **Phone Numbers:** Default `+91` country code with full international country code picker.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, Server & Client Components) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS (Custom enterprise theme tokens) |
| **Icons** | Lucide React |
| **Authentication** | Supabase Auth (SSR sessions, OTP, Password Reset) |
| **Database** | Supabase PostgreSQL (Custom functions, RLS, Triggers) |
| **Storage** | Supabase Storage (`travel-documents` bucket) |
| **Validation** | Zod |

---

## 📁 Project Structure

```
TripBoard/
├── app/                              # Next.js 15 App Router
│   ├── (auth)/                       # Unified login, registration, password recovery
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── verify-email/
│   ├── admin/                        # Admin Suite (KPIs, Employees, Trips)
│   │   ├── employees/
│   │   │   └── add/
│   │   └── trips/
│   │       ├── [id]/
│   │       └── create/
│   ├── employee/                     # Employee Portal & Coordinator Hub
│   │   ├── dashboard/
│   │   ├── documents/
│   │   └── trips/[id]/coordinator/
│   ├── layout.tsx                    # Root HTML & body structure
│   └── page.tsx                      # Landing page & authenticated redirects
├── components/                       # Modular UI & India-standard inputs
│   ├── layout/                       # Header & Footer variants
│   ├── trips/                        # EmployeeTripCard & progress bars
│   └── ui/                           # IndiaDatePicker, IndiaPhoneInput, RupeeInput
├── database/
│   └── schema.sql                    # Full PostgreSQL schema, RLS, triggers & functions
├── docs/                             # Architecture plans, ADRs, mockups & daily logs
│   ├── architecture/
│   ├── decisions/
│   ├── designs/                      # Approved HTML preview mockups
│   ├── legacy_html/                  # Preserved legacy templates & assets
│   └── logs/
├── lib/
│   ├── supabase/                     # Client, Server, and Middleware Supabase handlers
│   └── validation.ts                 # Form validations
├── middleware.ts                     # Session refresh & route shielding
├── public/                           # Static assets, SVG brand marks, background art
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🏁 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.18+ or v20+)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A [Supabase](https://supabase.com/) project

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Arpita-Shelke/TripBoard.git
cd TripBoard
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 4. Database Setup
1. Open your Supabase project's **SQL Editor**.
2. Run the migration script in `database/schema.sql`. This will initialize:
   - Multi-tenant tables (`companies`, `profiles`, `employees`, `trips`, `trip_assignments`, `documents`).
   - Row-Level Security (RLS) policies and security definer functions (`is_admin`, `is_trip_coordinator`).
   - Trigger for single-coordinator auto-assignment and user profile synchronization.
3. In Supabase Storage, create a bucket named `travel-documents`.

### 5. Running the Application
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3001) in your browser.

### 6. Production Build
Verify the production build:
```bash
npm run build
npm run start
```

---

## 🔒 Security Standards
- **Zero Exposed Keys:** Service role keys are restricted strictly to server contexts. Client components use anonymous public keys guarded by RLS.
- **Row-Level Security:** Unauthenticated or unauthorized cross-tenant queries are blocked directly at the database engine level.
- **Input Sanitization:** Sensitive identity and contact data conform to strict regex and validation patterns.

---

## 📄 License
This project is proprietary and confidential corporate software. All rights reserved © 2026 TripBoard.
