# TripBoard Demo Credentials & Testing Guide

This document contains pre-seeded accounts and instructions for testing the **TripBoard** enterprise travel management platform.

All accounts belong to the demo organization **TripBoard Tech India Pvt. Ltd.** (`tripboard.in`).

---

## 🔐 Quick Credentials Reference

> **Global Demo Password**: `Demo@1234`

| Persona | Name | Email | Password | Role / Access Level | Department |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Corporate Admin** | Vikramaditya Singhania | `admin@tripboard.in` | `Demo@1234` | Full Admin (`/admin`) | Executive Leadership |
| **Lead Coordinator** | Rahul Sharma | `rahul.sharma@tripboard.in` | `Demo@1234` | Employee + Trip Coordinator ⭐ (`/employee/dashboard`, `/employee/trips/[id]/manage`) | Engineering (`EMP-001`) |
| **Business Traveler** | Priya Patel | `priya.patel@tripboard.in` | `Demo@1234` | Employee (`/employee/dashboard`) | Product (`EMP-002`) |
| **Traveler (Compliance Alert)** | Amit Verma | `amit.verma@tripboard.in` | `Demo@1234` | Employee (`/employee/dashboard`) | Design (`EMP-003`) |

---

## 🧭 Persona Testing Scenarios

### 1. Corporate Admin (`admin@tripboard.in`)
- **Login Target:** `/login` &rarr; redirects to `/admin`
- **Dashboard Overview:**
  - **Total Employees:** 3
  - **Active Trips:** 1 (Mumbai Roadshow)
  - **Upcoming Trips:** 1 (Bengaluru Tech Summit)
  - **Total Travel Budget Allocated:** ₹ 3,55,000 (INR)
- **Features to Verify:**
  - Complete visibility over company trips, assigned travelers, and department budgets.
  - Ability to review and verify company-wide travel compliance documents.
  - Indian localization standards: Currency in ₹ INR, dates formatted as `DD/MM/YYYY`, phone numbers prefixed with `+91`.

---

### 2. Lead Coordinator (`rahul.sharma@tripboard.in`)
- **Login Target:** `/login` &rarr; redirects to `/employee/dashboard`
- **Trip:** **Q4 Tech Architecture Summit (Bengaluru)** (`15/11/2026` &ndash; `18/11/2026`)
- **Features to Verify:**
  - **Coordinator Star Badge (⭐):** Highlighted as designated Trip Coordinator.
  - **Coordinator Hub Access:** Dedicated "Manage Trip" capability to oversee co-travelers (Priya Patel, Amit Verma).
  - **Dual-Budget Tracking:**
    - Group Shared Budget: ₹ 1,50,000
    - Individual Allowance: ₹ 25,000 per traveler
    - Total Budget: ₹ 2,25,000
  - Verified travel documents (Passport & roundtrip flight ticket).

---

### 3. Business Traveler (`priya.patel@tripboard.in`)
- **Login Target:** `/login` &rarr; redirects to `/employee/dashboard`
- **Trips:**
  - **Q4 Tech Architecture Summit (Bengaluru)** (`15/11/2026` &ndash; `18/11/2026`): Upcoming status.
  - **Enterprise Client Roadshow (Mumbai)** (`05/10/2026` &ndash; `10/10/2026`): In-Progress status.
- **Features to Verify:**
  - Standard employee dashboard view with upcoming and active itineraries.
  - Personal document vault with verified passport copy.

---

### 4. Traveler with Action Required (`amit.verma@tripboard.in`)
- **Login Target:** `/login` &rarr; redirects to `/employee/dashboard`
- **Trips:** Assigned to Bengaluru Summit & Mumbai Roadshow.
- **Features to Verify:**
  - **Action Required Alert:** Highlighted banner indicating travel compliance pending (`corporate_travel_insurance_policy.pdf` in `pending` review status).
  - Demonstrates workflow for unverified documents and employee notifications.

---

## 🇮🇳 Localization & Standards
- **Currency:** Indian Rupee (`₹ INR`).
- **Dates:** `DD/MM/YYYY` format throughout all interfaces.
- **Phone Numbers:** Default `+91` country code.
- **Responsive Layout:** Desktop-first design with mobile-friendly adaptation.

---

## 🛠️ Re-Seeding the Database
If demo data is ever wiped or modified, re-apply the idempotent seed script:

```powershell
npx supabase db query --linked -f database/seed_demo_accounts.sql
```
