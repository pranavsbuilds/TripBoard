# Implementation Plan: Academic Resources (Phase 2)

**Stage:** Phase 2 — Academic Resources (Home Page)  
**Target Feature Branch:** `feature/academic-resources-phase2`  
**Reference Design:** [`docs/designs/academic-resources-preview.html`](file:///c:/projects/TripBoard/docs/designs/academic-resources-preview.html)  
**Security Reference:** [`docs/architecture/security_audit.md`](file:///c:/projects/TripBoard/docs/architecture/security_audit.md)  

---

## 1. Background

TripBoard serves as an academic showcase and mini-project. As part of its educational specifications, the application must provide accessible, functional sections on the public home page for students, instructors, and evaluators to view curriculum assets:

1. **View Assignments:** 8 comprehensive engineering assignments.
2. **View Experiments:** 10 technical hands-on lab experiments.

### Key Requirements & Constraints:
- **Database Driven:** Resource metadata (ID, type, number, title, logical path, description) must be maintained in the database (`public.academic_resources`) rather than hardcoded in React components.
- **Idempotent Seeding:** A database seed script must populate all 18 records without creating duplicates upon re-execution.
- **Sorted & Categorized:** Assignments and experiments must be queried, separated by `resource_type`, and sorted by `resource_number` in ascending order (1..8 and 1..10).
- **Reusable UI Component:** A single reusable component (`AcademicResourcesSection.tsx`) must render both sections to prevent code duplication, following the established Tailwind CSS design system (`primary-dark`, `primary-blue`, `gold-btn`, `bg-ice`, `rounded-xl`, `rounded-2xl`).
- **In-App PDF Viewer:** Clicking "View PDF" opens an in-app viewer modal (`PdfViewerModal.tsx`) with return navigation without forcing browser downloads.
- **Graceful File Handling:** As confirmed by codebase inspection, the 18 physical PDF binaries are not bundled in the initial repository. The viewer must gracefully handle missing files by displaying an informative in-app placeholder indicating the target file path (`public/home/...`) rather than crashing the page.
- **No Unnecessary Features:** Avoid editing, annotating, or uploading for academic resources; maintain a clean, read-only delivery mechanism.

---

## 2. Core Model Flow

```
========================================================================================
DATABASE SEEDING & DATA MODEL (PostgreSQL + Supabase)
========================================================================================

[ database/seed_academic_resources.sql ]
       │
       ├─► Inserts 8 Assignment records (resource_number 1..8)
       ├─► Inserts 10 Experiment records (resource_number 1..10)
       └─► ON CONFLICT (resource_type, resource_number) DO UPDATE (guarantees idempotency)
             │
             ▼
[ public.academic_resources Table ]
       │
       ├─► id (UUID)
       ├─► resource_type ('assignment' | 'experiment')
       ├─► resource_number (INTEGER)
       ├─► title (TEXT)
       ├─► description (TEXT)
       ├─► file_path (TEXT: '/home/Assignment/Assignment_X.pdf' or '/home/Experiment/Experiment_Y.pdf')
       └─► is_active (BOOLEAN default true)

                                      │
                                      ▼
========================================================================================
HOME PAGE RENDERING FLOW (app/page.tsx)
========================================================================================

[ Home Page Request (GET /) ]
       │
       ├─► Server-side query: supabase.from('academic_resources').select('*').eq('is_active', true).order('resource_number', { ascending: true })
       ├─► Splits results into:
       │     - assignments: resources where resource_type == 'assignment' (8 items)
       │     - experiments: resources where resource_type == 'experiment' (10 items)
       │
       ▼
[ Render Reusable AcademicResourcesSection ]
       │
       ├─► Section 1: "VIEW ASSIGNMENTS" (8 cards with title, badge, desc, "View PDF" button)
       └─► Section 2: "VIEW EXPERIMENTS" (10 cards with title, badge, desc, "View PDF" button)

                                      │
                                      ▼
========================================================================================
IN-APP PDF VIEWING FLOW (PdfViewerModal)
========================================================================================

[ User clicks "View PDF" on any Assignment or Experiment ]
       │
       ▼
[ PdfViewerModal Opens In-App ]
       │
       ├─► Displays: Resource Title, Badge, and Logical File Path
       ├─► Attempts to load embedded reader: <iframe src="${filePath}#toolbar=0" />
       │
       ├─► If PDF exists on disk (public/home/...):
       │     └─► Streams PDF directly inside the modal; user reads without downloading
       │
       └─► If PDF is missing on disk:
             └─► Renders informative in-app placeholder explaining target path without throwing errors
       │
       ▼
[ "Close Reader" / "Return to Home Page" returns user to Home screen ]
```

---

## 3. Database Schema & Idempotent Seed Data

### A. Table Definition: `public.academic_resources`
```sql
create table if not exists public.academic_resources (
  id uuid default gen_random_uuid() primary key,
  resource_type text check (resource_type in ('assignment', 'experiment')) not null,
  resource_number integer not null,
  title text not null,
  description text,
  file_path text not null,
  is_active boolean default true not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (resource_type, resource_number)
);

create index if not exists idx_academic_resources_type_num 
  on public.academic_resources(resource_type, resource_number);

-- Enable Row Level Security
alter table public.academic_resources enable row level security;

-- Public read access: all visitors (authenticated & unauthenticated) can view curriculum resources
create policy "academic_resources_public_select" 
  on public.academic_resources
  for select 
  using (true);

-- Admin mutation policy: only authorized administrators can modify curriculum records
create policy "academic_resources_admin_crud" 
  on public.academic_resources
  for all 
  using (public.is_admin())
  with check (public.is_admin());
```

### B. Idempotent Seed Script: `database/seed_academic_resources.sql`
Populates all 18 records with upsert semantics:

```sql
insert into public.academic_resources (resource_type, resource_number, title, description, file_path)
values
  -- 8 Assignments
  ('assignment', 1, 'System Requirements Analysis', 'Enterprise workflow mapping, persona specifications, and functional boundaries.', '/home/Assignment/Assignment_1.pdf'),
  ('assignment', 2, 'Database Schema & Entity Modeling', 'Relational PostgreSQL schema design, foreign keys, and indexes.', '/home/Assignment/Assignment_2.pdf'),
  ('assignment', 3, 'Role-Based Access Control Architecture', 'Admin, Coordinator, and Traveler permissions and RLS policies.', '/home/Assignment/Assignment_3.pdf'),
  ('assignment', 4, 'RESTful API & Server Action Protocols', 'Server action mutations, client-server data flow, and error handling.', '/home/Assignment/Assignment_4.pdf'),
  ('assignment', 5, 'Multi-Tenant Enterprise Isolation', 'Company tenant scoping, company domain resolution, and data leaks prevention.', '/home/Assignment/Assignment_5.pdf'),
  ('assignment', 6, 'Cloud Storage Security & Signed URLs', 'Private bucket architecture, tokenized signed URLs, and short expiry policies.', '/home/Assignment/Assignment_6.pdf'),
  ('assignment', 7, 'Travel Compliance & Document Verification', 'Mandatory travel document requirements, status tracking, and review workflows.', '/home/Assignment/Assignment_7.pdf'),
  ('assignment', 8, 'Performance Optimization & Audit Logging', 'Query indexing, server cache boundaries, and development session tracking.', '/home/Assignment/Assignment_8.pdf'),

  -- 10 Experiments
  ('experiment', 1, 'Authentication & Session Token Handling', 'Magic links, PKCE code exchange, and cookie guards.', '/home/Experiment/Experiment_1.pdf'),
  ('experiment', 2, 'Real-Time State Management & Invalidation', 'Asynchronous data orchestration and cache invalidation.', '/home/Experiment/Experiment_2.pdf'),
  ('experiment', 3, 'Secure File Uploads & MIME Validation', 'Strict < 1 MB limit, extension and MIME byte checks.', '/home/Experiment/Experiment_3.pdf'),
  ('experiment', 4, 'Row Level Security (RLS) Policy Execution', 'Fine-grained PostgreSQL database security rules.', '/home/Experiment/Experiment_4.pdf'),
  ('experiment', 5, 'Responsive UI Engineering with Tailwind CSS', 'Design tokens, elevation cards, and responsive layout.', '/home/Experiment/Experiment_5.pdf'),
  ('experiment', 6, 'Dual-Budget Aggregation & Calculation', 'Separation of group capital vs per-diem allowances.', '/home/Experiment/Experiment_6.pdf'),
  ('experiment', 7, 'Travel Coordinator Workflow Orchestration', 'Designated traveler lead workflows and group bookings.', '/home/Experiment/Experiment_7.pdf'),
  ('experiment', 8, 'In-App Document Preview Modal Integration', 'Embedded iframe PDF and image canvas viewer.', '/home/Experiment/Experiment_8.pdf'),
  ('experiment', 9, 'Edge Middleware & Route Guarding', 'Next.js routing proxy and role redirect gates.', '/home/Experiment/Experiment_9.pdf'),
  ('experiment', 10, 'Academic Resource Routing & Serving', 'Database-backed resource model and static PDF integration.', '/home/Experiment/Experiment_10.pdf')

on conflict (resource_type, resource_number) do update set
  title = excluded.title,
  description = excluded.description,
  file_path = excluded.file_path,
  is_active = excluded.is_active;
```

---

## 4. Static Asset Structure & Routing Conventions

In Next.js 15, files placed inside the `public/` folder are served directly at the root URL path.

To satisfy the logical path structure requested (`/home/Assignment/Assignment_X.pdf` and `/home/Experiment/Experiment_Y.pdf`):
- Directory paths in the repository:
  - `public/home/Assignment/`
  - `public/home/Experiment/`
- Direct browser access:
  - `GET http://localhost:3001/home/Assignment/Assignment_1.pdf` $\rightarrow$ served from `public/home/Assignment/Assignment_1.pdf`
  - `GET http://localhost:3001/home/Experiment/Experiment_1.pdf` $\rightarrow$ served from `public/home/Experiment/Experiment_1.pdf`

---

## 5. Proposed Component & UI Architecture

### A. Reusable Component: `components/academic/AcademicResourcesSection.tsx`
- **Location:** `components/academic/AcademicResourcesSection.tsx`
- **Props:**
  ```ts
  export interface AcademicResource {
    id: string;
    resource_type: 'assignment' | 'experiment';
    resource_number: number;
    title: string;
    description: string | null;
    file_path: string;
  }

  interface AcademicResourcesSectionProps {
    type: 'assignment' | 'experiment';
    title: string;
    subtitle: string;
    badgeText: string;
    resources: AcademicResource[];
    onSelectResource: (resource: AcademicResource) => void;
  }
  ```
- **Styling:**
  - Section container: `py-16 px-6 md:px-[8%]` matching existing Features section.
  - Section title: Centered, with gold accent bar (`after:content-[''] after:block after:w-16 after:h-1 after:bg-gold-btn after:mx-auto after:mt-3 after:rounded-full`).
  - Card grid: Desktop 4 columns (`lg:grid-cols-4`) for assignments, 5 columns (`lg:grid-cols-5`) for experiments, tablet 2 columns, mobile 1 column.
  - Card styling: `bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:border-brand-blue hover:-translate-y-1 transition duration-200`.
  - Action button: "View PDF" with file icon, invoking `onSelectResource`.

---

### B. In-App PDF Viewer Modal: `components/academic/PdfViewerModal.tsx`
- **Location:** `components/academic/PdfViewerModal.tsx`
- **Props:**
  ```ts
  interface PdfViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    resource: AcademicResource | null;
  }
  ```
- **Features:**
  - Backdrop overlay: `fixed inset-0 z-50 bg-primary-dark/80 backdrop-blur-sm flex items-center justify-center p-4`.
  - Header: Displays resource number pill, title, logical path, and close button (`✕`).
  - Reader Area: Checks or loads `<iframe src="${resource.file_path}#toolbar=0" className="w-full h-full border-0" />`.
  - **Graceful Fallback:** An `onError` handler / fetch probe detects if the PDF is not yet placed on disk, rendering a clean in-app card:
    - *"Academic Resource Infrastructure Ready"*
    - Target file path guide (`public/home/Assignment/Assignment_X.pdf`).
    - Explicit notification that placing the PDF in the target folder will immediately stream it without code changes.
  - Footer: "Return to Home Page" button calling `onClose`.

---

### C. Home Page Integration: `app/page.tsx`
- In `app/page.tsx`:
  - Fetch `academic_resources` from Supabase:
    ```ts
    const { data: resources } = await supabase
      .from('academic_resources')
      .select('*')
      .eq('is_active', true)
      .order('resource_number', { ascending: true });
    ```
  - Partition resources:
    - `assignments = resources.filter(r => r.resource_type === 'assignment')` (8 items)
    - `experiments = resources.filter(r => r.resource_type === 'experiment')` (10 items)
  - Render a client container component `components/academic/AcademicHomeHub.tsx` hosting both sections and the interactive `PdfViewerModal`.
  - Place the sections between the Hero section and the Features section.
  - Add navigation anchor links in the header navbar (`Assignments`, `Experiments`).

---

## 6. What Is Being Removed

| Component / File | What Is Being Removed | Rationale |
|---|---|---|
| None (Net-new sections) | No existing business or trip code is removed | Phase 2 exclusively adds academic resource viewing capabilities to the home page while preserving all existing landing content. |

---

## 7. File Change Summary (Phase 2)

| File | Action | Description |
|---|---|---|
| `database/seed_academic_resources.sql` | Create | SQL migration & idempotent seed script populating 8 assignments and 10 experiments |
| `components/academic/AcademicResourcesSection.tsx` | Create | Reusable card grid component for assignments and experiments |
| `components/academic/PdfViewerModal.tsx` | Create | In-app PDF reader modal with graceful missing file handling |
| `components/academic/AcademicHomeHub.tsx` | Create | Client wrapper orchestrating resource section selection and modal state |
| `app/page.tsx` | Modify | Query academic resources from database and render sections on Home Page |
| `docs/logs/2026-10-14.md` | Create / Modify | Daily development progress log |

---

## 8. Verification Checklist (Phase 2)

1. [ ] `public.academic_resources` table created with RLS enabled.
2. [ ] Seed script executes idempotently populating 8 assignments and 10 experiments.
3. [ ] Re-running the seed script causes zero duplicate key errors.
4. [ ] Home page displays **View Assignments** section with 8 cards sorted 1 to 8.
5. [ ] Home page displays **View Experiments** section with 10 cards sorted 1 to 10.
6. [ ] Clicking "View PDF" opens the in-app viewer modal.
7. [ ] Missing physical PDF files render a clean target path placeholder without throwing unhandled exceptions.
8. [ ] Placing an actual PDF in `public/home/...` renders seamlessly inside the embedded reader.
9. [ ] Responsive layout verified on desktop and mobile screens.
10. [ ] `npm run build` compiles with zero errors across all routes.

---

## 9. External Tasks Guide (Physical PDF Asset Placement)

To view the full binary contents of the academic resources, place the 18 PDF files in the repository under `public/`:

### Assignments (8 Files):
1. `public/home/Assignment/Assignment_1.pdf`
2. `public/home/Assignment/Assignment_2.pdf`
3. `public/home/Assignment/Assignment_3.pdf`
4. `public/home/Assignment/Assignment_4.pdf`
5. `public/home/Assignment/Assignment_5.pdf`
6. `public/home/Assignment/Assignment_6.pdf`
7. `public/home/Assignment/Assignment_7.pdf`
8. `public/home/Assignment/Assignment_8.pdf`

### Experiments (10 Files):
1. `public/home/Experiment/Experiment_1.pdf`
2. `public/home/Experiment/Experiment_2.pdf`
3. `public/home/Experiment/Experiment_3.pdf`
4. `public/home/Experiment/Experiment_4.pdf`
5. `public/home/Experiment/Experiment_5.pdf`
6. `public/home/Experiment/Experiment_6.pdf`
7. `public/home/Experiment/Experiment_7.pdf`
8. `public/home/Experiment/Experiment_8.pdf`
9. `public/home/Experiment/Experiment_9.pdf`
10. `public/home/Experiment/Experiment_10.pdf`
