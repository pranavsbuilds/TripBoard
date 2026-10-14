# Mini Project Report: TripBoard – Corporate Travel Management Platform

**Course:** FSJP (2113611) Mini Project  
**Academic Year:** 2025 – 2026  
**Department:** Department of Computer Engineering, University of Mumbai  
**Submitted By:**
- B – 341 Arpita Shelke
- B – 348 Pranav Supugade
- B – 349 Parth Sutar

**Submitted To:** Prof. Naina Kaushik  

---

## Certificate

This is to certify that **(B – 341) Arpita Shelke**, **(B – 348) Pranav Supugade**, and **(B – 349) Parth Sutar** have satisfactorily completed this mini project entitled **“TripBoard – Corporate Travel Management Platform”** towards the partial fulfilment of the **Bachelor of Engineering (IIIʳᵈ Semester in Computer Engineering)** as laid by the University of Mumbai.

---

## 1. Abstract

Tripboard is a web-based corporate travel management system designed to help small and medium-sized businesses organize and manage employee business trips efficiently. Companies often need to coordinate employee travel, flight and hotel arrangements, budgets, schedules, documentation, and expense records. Managing these activities through separate spreadsheets, emails, and messaging applications can be time-consuming and difficult to track.

The proposed Tripboard system provides a centralized platform for organizing corporate travel information. It aims to help companies manage employee details, plan trips, maintain travel schedules, monitor budgets and expenses, and access important trip-related information from a single interface. Depending on the implemented features, the system can also support authentication, role-based access, notifications, and travel document management.

The website is developed using HTML, CSS, and JavaScript for the user interface. Supabase is integrated for authentication and database services, while Git and GitHub support source-code management. The project aims to improve accessibility, organization, and efficiency in corporate travel planning while reducing manual administrative work.

---

## 2. Problem Definition

### 2.1 Problem Statement
Small and medium-sized companies often face difficulties managing employee business trips because travel information is distributed across multiple platforms. Details about employees, flights, hotels, budgets, schedules, and expenses may be stored separately, making it difficult to maintain accurate records and coordinate travel activities.

Manual management can lead to duplicated information, delays in communication, difficulty tracking expenses, and limited visibility into upcoming trips. Therefore, there is a need for a centralized, user-friendly web application that simplifies corporate travel planning and management.

### 2.2 Proposed Solution
Tripboard proposes a centralized web-based platform through which authorized company users can organize corporate travel information in one place. The proposed system aims to:
- Maintain employee and trip information.
- Organize travel schedules and accommodation details.
- Track budgets and travel-related expenses in Indian standard currency (₹ INR).
- Keep important travel documents and information accessible (< 1MB PDF/JPG/PNG).
- Provide a structured dashboard for managing upcoming trips.
- Support secure access where authentication is implemented.

---

## 3. System Flowchart

The system flowchart depicts the end-to-end operational lifecycle of the TripBoard platform across four streamlined stages:
1. **Access & Role Check:** Initial authentication via Supabase Auth with email OTP and password verification, routing users to their authorized operational track.
2. **Operational Tracks:** Parallel workflows for Company Administrators (creating trips, budgets in ₹ INR, document checklists, and traveler assignments) and Employees (accessing personalized dashboards and uploading verified travel documents < 1MB).
3. **Coordinator Verification:** Compliance review where trip coordinators inspect travel credentials and grant approvals or request corrections.
4. **Departure & Clearance:** Final transition to "Ready for Travel", trip commencement, and post-trip archival.

![Figure 3.1: TripBoard System Operational Flowchart](C:/Users/Admin/OneDrive/Documents/Lab%20Reports/Java/system_flowchart.png)
*Figure 3.1: TripBoard System Operational Flowchart*

---

## 4. System Architecture

TripBoard follows an enterprise-grade 4-tier web architecture that balances high responsiveness, strict security isolation, and rapid development:
1. **Client Layer (Browser):** Built using Next.js 15 App Router and React 19 with Tailwind CSS. Provides responsive, desktop-first interfaces for Admin workspace management, Employee dashboards, and Trip Coordinator compliance portals.
2. **Application Server Layer:** Next.js server actions, middleware, and route handlers validate incoming inputs using Zod and format data according to Indian regional standards (DD/MM/YYYY date formatting, INR ₹ currency displays, and +91 phone default).
3. **Backend Services (Supabase):** Provides GoTrue authentication with JWT session cookies and email OTP verification. Supabase Storage provides secure, private object buckets for travel document uploads with signed URLs.
4. **Database Layer (PostgreSQL):** Enterprise relational database utilizing Row Level Security (RLS) to enforce strict multi-tenant data isolation by `company_id`, ensuring enterprise data privacy across companies, employees, trips, and documents.

![Figure 4.1: TripBoard 4-Tier System Architecture Diagram](C:/Users/Admin/OneDrive/Documents/Lab%20Reports/Java/system_architecture.png)
*Figure 4.1: TripBoard 4-Tier System Architecture Diagram*

---

## 5. Software Requirements

| Software | Purpose |
| :--- | :--- |
| **Visual Studio Code** | Writing and editing project files |
| **HTML / React 19** | Structuring web pages and component templates |
| **Tailwind CSS** | Styling and responsive layouts |
| **TypeScript / Next.js 15** | Server-side rendering, client-side logic, and API actions |
| **Git** | Version control |
| **GitHub** | Hosting the repository and collaborating with team members |
| **Supabase** | Authentication, object storage, and PostgreSQL database |
| **Vercel** | Website deployment |

---

## 6. Source Code

The following source code excerpts represent the primary technical components of the TripBoard platform, demonstrating multi-tenant database design with Row Level Security, authentication middleware, server action handlers, and travel document validation schemas.

### 6.1 Multi-Tenant Relational Schema & Row Level Security (`database/schema.sql`)
```sql
-- Companies Table (Multi-Tenant Anchor)
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles Table (Tied 1:1 to auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'employee')) DEFAULT 'employee' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trips Table
CREATE TABLE public.trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_budget NUMERIC(12,2) DEFAULT 0 NOT NULL,
  status TEXT CHECK (status IN ('draft', 'upcoming', 'in_progress', 'completed')) DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Policy
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view trips belonging to their company"
  ON public.trips FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));
```

### 6.2 Authentication & Role-Based Middleware (`lib/supabase/middleware.ts`)
```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const isPublicRoute = ['/', '/login', '/register', '/verify-email'].includes(pathname);

  // Unauthenticated users trying to access protected routes
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return supabaseResponse;
}
```

### 6.3 Trip Creation & Document Requirement Server Action (`app/admin/trips/actions.ts`)
```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
import { ensureAdminCompany } from '@/app/admin/employees/actions';

export async function createTripAction(input: CreateTripInput): Promise<CreateTripResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized: Please log in.' };

  const { companyId } = await ensureAdminCompany();
  
  // 1. Insert Trip Record
  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .insert({
      company_id: companyId,
      destination: input.destination,
      purpose: input.purpose,
      start_date: input.startDate,
      end_date: input.endDate,
      total_budget: input.totalBudget,
      status: 'upcoming'
    })
    .select('id')
    .single();

  if (tripErr) return { success: false, error: tripErr.message };

  // 2. Insert Document Checklist Requirements
  if (input.requiredDocuments && input.requiredDocuments.length > 0) {
    const docRecords = input.requiredDocuments.map(docType => ({
      trip_id: trip.id,
      company_id: companyId,
      document_type: docType,
      is_mandatory: true
    }));
    await supabase.from('trip_document_requirements').insert(docRecords);
  }

  return { success: true, tripId: trip.id };
}
```

### 6.4 Travel Document Restrictions & Zod Schemas (`lib/validation.ts`)
```typescript
import { z } from 'zod';

/** Strict 1 MB file ceiling: files must be strictly under 1,048,576 bytes */
export const MAX_DOC_FILE_SIZE = 1_048_576; // 1 MB

/** Allowed MIME types for travel document uploads */
export const ALLOWED_DOC_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const travelDocUploadSchema = z.object({
  tripId: z.string().uuid('Invalid Trip ID'),
  documentType: z.enum(['passport', 'visa', 'flight_ticket', 'hotel_booking', 'insurance']),
  fileSize: z.number().max(MAX_DOC_FILE_SIZE, 'File size must be strictly under 1 MB'),
  fileType: z.enum(ALLOWED_DOC_MIME_TYPES, {
    errorMap: () => ({ message: 'Only PDF, JPG, PNG, and WebP files are allowed' })
  }),
});
```

---

## 7. Output Screenshots

The following screenshots demonstrate the core user interfaces and working features of the TripBoard application:

### Figure 7.1: TripBoard Landing Page & Platform Overview
![Figure 7.1: TripBoard Landing Page & Platform Overview](C:/Users/Admin/OneDrive/Documents/Lab%20Reports/Java/screenshots/01_landing_page.png)

### Figure 7.2: Secure Login & Email OTP Authentication Interface
![Figure 7.2: Secure Login & Email OTP Authentication Interface](C:/Users/Admin/OneDrive/Documents/Lab%20Reports/Java/screenshots/02_login_page.png)

### Figure 7.3: Admin Workspace & Employee Directory Management
![Figure 7.3: Admin Workspace & Employee Directory Management](C:/Users/Admin/OneDrive/Documents/Lab%20Reports/Java/screenshots/03_admin_dashboard_employees.png)

### Figure 7.4: Trip Creation & Document Checklist Configuration
![Figure 7.4: Trip Creation & Document Checklist Configuration](C:/Users/Admin/OneDrive/Documents/Lab%20Reports/Java/screenshots/04_trip_creation_documents.png)

### Figure 7.5: Employee Dashboard & Travel Compliance Vault
![Figure 7.5: Employee Dashboard & Travel Compliance Vault](C:/Users/Admin/OneDrive/Documents/Lab%20Reports/Java/screenshots/05_employee_dashboard.png)

---

## 8. References

1. Next.js 15 Documentation — Vercel Inc., [https://nextjs.org/docs](https://nextjs.org/docs)
2. Supabase Documentation (Auth, Storage & Database) — Supabase Inc., [https://supabase.com/docs](https://supabase.com/docs)
3. PostgreSQL 16 Official Manual & Row Level Security — PostgreSQL Global Development Group, [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
4. Tailwind CSS Utility Framework Documentation — Tailwind Labs Inc., [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
5. W3C Web Accessibility Initiative (WAI-ARIA 1.2) — World Wide Web Consortium, [https://www.w3.org/WAI/](https://www.w3.org/WAI/)
6. React 19 Core Documentation — Meta Platforms, Inc., [https://react.dev/](https://react.dev/)
