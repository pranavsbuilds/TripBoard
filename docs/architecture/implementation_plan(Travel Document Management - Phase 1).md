# Implementation Plan: Travel Document Management (Phase 1)

**Stage:** Phase 1 — Travel Document Upload & Trip Compliance  
**Target Feature Branch:** `feature/doc-management-phase1`  
**Reference Design:** [`docs/designs/trip-creation-and-card-preview.html`](file:///c:/projects/TripBoard/docs/designs/trip-creation-and-card-preview.html)  
**Security Reference:** [`docs/architecture/security_audit.md`](file:///c:/projects/TripBoard/docs/architecture/security_audit.md)  

---

## 1. Project Phasing Architecture

Per user directive, the project scope is divided into two sequential phases:

- **PHASE 1 (CURRENT FOCUS):** **Travel Document Upload & Management for Trips**
  - Admin trip-specific document requirements configuration via compact dropdown checkbox.
  - Private Supabase Storage bucket (`travel-documents`) integration with authenticated signed URLs.
  - Strict file restrictions ($< 1\text{ MB}$, PDF, JPG, PNG, WebP) on both frontend and backend.
  - Employee trip details document vault (`/employee/trips/[id]`) with upload, view, and replace actions.
  - Decoupling the misleading global document counter from the employee dashboard in favor of per-trip completion.
  - Minimal in-app preview modal for images and PDFs without forced downloads.

- **PHASE 2 (DEFERRED TO SUBSEQUENT STAGE):** **Academic Resources (Home Page)**
  - Database schema & seed script for 8 assignments and 10 experiments (`public.academic_resources`).
  - Home page UI sections (**View Assignments** and **View Experiments**).
  - In-app embedded PDF viewer and graceful missing file handling.

---

## 2. Phase 1 Core Model Flow

```
========================================================================================
ADMIN TRIP CONFIGURATION & REQUIREMENT SPECIFICATION
========================================================================================

[ Admin: Create Trip (/admin/trips/create) ]
       │
       ├─► Inputs Destination, Purpose, Dates, Budget, Travelers, Coordinator
       ├─► Selects Required Travel Documents from compact Dropdown Checkbox:
       │     [ Passport, Visa, Flight Ticket, Govt ID, Hotel, Insurance, Other ]
       │     (No mandatory/optional tags, no descriptions, non-intrusive)
       │
       ▼
[ Server Action: createTripAction in app/admin/trips/actions.ts ]
       │
       ├─► Inserts record into public.trips
       ├─► Inserts traveler records into public.trip_assignments
       └─► Inserts requirement records into public.trip_document_requirements

                                      │
                                      ▼
========================================================================================
EMPLOYEE TRIP VAULT & SECURE UPLOAD FLOW
========================================================================================

[ Employee Dashboard (/employee/dashboard) ]
       │
       ├─► Global "Docs Verified" counter REMOVED from top banner
       └─► Assigned Trip Cards display dynamic per-trip completion badge (e.g., "2/3 Docs Uploaded")
             │
             ▼
[ Employee Opens Trip Details (/employee/trips/[id]) ]
       │
       ├─► Retrieves document requirements configured by Admin for this specific trip
       ├─► Displays requirement list with current status:
       │     - Pending Upload: Dropzone with strict < 1 MB limit warning
       │     - Uploaded: View Document & Replace File actions
       │
       ▼
[ File Upload Execution ]
       │
       ├─► Client Validation: File size strictly < 1 MB, extension in [.pdf, .jpg, .jpeg, .png, .webp]
       │
       ▼
[ Server Action: uploadTripDocumentAction in app/employee/trips/actions.ts ]
       │
       ├─► Authenticates user session & validates traveler assignment on trip
       ├─► Strict Server Validation:
       │     - Rejects file.size >= 1048576 bytes with 400 error
       │     - Rejects unauthorized MIME types
       ├─► Uploads to private bucket: travel-documents/trips/{tripId}/employees/{empId}/{docType}_{ts}.ext
       ├─► Upserts record in public.documents (status: 'pending')
       └─► Revalidates trip view; updates completion metrics dynamically

                                      │
                                      ▼
========================================================================================
MINIMAL IN-APP PREVIEW MODAL
========================================================================================

[ Admin or Employee Clicks "View Document" ]
       │
       ├─► Server Action: getDocumentSignedUrlAction generates 1-hour signed URL from private bucket
       └─► Minimal Document Preview Modal opens:
             - Header: File name, traveler name, document type, close button (✕)
             - Body: Embedded viewer (<iframe src="${signedUrl}#toolbar=0" /> for PDF, <img> for images)
             - Footer: Simple close button (No verbose promotional or inspection headers)
             - Never forces a browser file download
```

---

## 3. What Is Being Removed in Phase 1

| Component / File | What Is Being Removed | Rationale |
|---|---|---|
| `app/employee/dashboard/page.tsx` | Global `docsCount.verified / docsCount.total` ("Docs Verified") counter in banner | Requirements differ by trip; global count is misleading. Replaced by per-trip completion badges on assigned trip cards. |
| `app/employee/dashboard/page.tsx` | Global "Action Required: Travel Documents" banner calculated from total DB documents | Document compliance belongs within the context of specific trips. |
| `app/employee/documents/page.tsx` | Hardcoded static 5 document types (`passport`, `visa`, `ticket`, `hotel`, `insurance`) | Documents must be driven dynamically by trip-specific admin requirements. |
| `app/employee/documents/page.tsx` | Direct `URL.createObjectURL(file)` client-side blob assignment | Replaced with real server-side upload to private Supabase storage bucket `travel-documents`. |

---

## 4. Proposed Changes for Phase 1

### A. Database Schema & Storage Configuration

#### 1. New Table: `public.trip_document_requirements`
```sql
create table if not exists public.trip_document_requirements (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  document_type text not null,
  title text not null,
  is_mandatory boolean default true not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (trip_id, document_type)
);

create index if not exists idx_trip_doc_reqs_trip on public.trip_document_requirements(trip_id);

alter table public.trip_document_requirements enable row level security;

create policy "trip_doc_reqs_admin_crud" on public.trip_document_requirements
  for all using (
    public.is_admin() and trip_id in (select id from public.trips where company_id = public.get_current_company_id())
  )
  with check (
    public.is_admin() and trip_id in (select id from public.trips where company_id = public.get_current_company_id())
  );

create policy "trip_doc_reqs_employee_select" on public.trip_document_requirements
  for select using (
    trip_id in (select public.get_my_assigned_trip_ids())
    or (public.is_admin() and trip_id in (select id from public.trips where company_id = public.get_current_company_id()))
  );
```

#### 2. Update Table: `public.documents`
- Add `storage_path text` column to store canonical private bucket object keys.
- Update `document_type` check constraint to validate `passport`, `visa`, `ticket`, `gov_id`, `hotel`, `insurance`, `other`.

#### 3. Storage Bucket: `travel-documents`
- Ensure bucket `travel-documents` is private (`public: false`).
- Object keys: `trips/${tripId}/employees/${employeeId}/${documentType}_${Date.now()}.${ext}`.

---

### B. Admin Trip Creation: Compact Document Requirements Dropdown

**Files:** `app/admin/trips/create/page.tsx` & `app/admin/trips/actions.ts`
- Add compact dropdown checkbox for "Required Travel Documents" under Trip Details in `CreateTripPage`.
- Clean trigger button showing selected count / summary (e.g., `Passport, Visa, Flight Ticket (3 Selected) ▼`).
- Dropdown checkboxes for:
  - `passport` (Passport)
  - `visa` (Visa)
  - `ticket` (Flight Ticket)
  - `gov_id` (Government ID Proof)
  - `hotel` (Hotel Booking)
  - `insurance` (Travel Insurance)
  - `other` (Other Document)
- **No mandatory/optional tags, no descriptions.** Non-intrusive and clean.
- Update `createTripAction` in `app/admin/trips/actions.ts` to insert selected document requirements into `public.trip_document_requirements`.

---

### C. Employee Dashboard & Trips Document Vault

#### 1. Employee Dashboard Update (`app/employee/dashboard/page.tsx`)
- Remove global `docsCount.verified / docsCount.total` statistic from the top welcome banner.
- Remove global "Action Required: Travel Documents" banner.
- Pass trip-specific document requirements into `EmployeeTripCard`.

#### 2. Employee Trip Card Component (`components/trips/EmployeeTripCard.tsx`)
- Display dynamic per-trip completion badge (e.g., `2/3 Docs Uploaded`).
- Add navigation link to `/employee/trips/${trip.id}`.

#### 3. Employee Trip Details Page (`app/employee/trips/[id]/page.tsx` - NEW)
- Displays trip details (dates, destination, coordinator).
- Lists documents required by Admin for this specific trip.
- Current status per requirement:
  - **Pending Upload:** upload dropzone with strict $< 1\text{ MB}$ limit.
  - **Uploaded:** file name, size, upload date, status (`pending`, `verified`, `rejected`), with "View Document" and "Replace File" buttons.
- Calculates dynamic completion count for this trip.

#### 4. Document Server Actions (`app/employee/trips/actions.ts` - NEW)
- `uploadTripDocumentAction`:
  - Validates session & trip assignment.
  - Strictly rejects `file.size >= 1048576` bytes ($1\text{ MB}$).
  - Strictly validates MIME types (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`).
  - Uploads to private bucket `travel-documents`.
  - Upserts `public.documents` row with `status: 'pending'`, `storage_path`, `file_name`, `file_size_bytes`.
- `getDocumentSignedUrlAction`:
  - Generates 1-hour authenticated signed URL for authorized viewers.

---

### D. Minimal In-App Document Preview Modal

**File:** `components/ui/DocumentPreviewModal.tsx` (NEW) & `app/admin/trips/[id]/page.tsx`
- Minimal in-app modal viewer matching approved design:
  - Clean header: file name, traveler name, document type, close button (`✕`).
  - Embedded viewer canvas: `<iframe src="${signedUrl}#toolbar=0" />` for PDF, `<img>` for images.
  - Footer: clean close action.
  - **No verbose inspection or promotional headers.**
  - Zero forced browser downloads.

---

## 5. File Change Summary (Phase 1)

| File | Action | Description |
|---|---|---|
| `docs/designs/trip-creation-and-card-preview.html` | Modified | Integrated design preview: compact dropdown checkbox, trip card, and minimal preview modal |
| `docs/architecture/security_audit.md` | Modified | Security audit covering private storage, file size (< 1 MB), and signed URLs |
| `database/schema_updates_phase1.sql` | Create | SQL migration adding `trip_document_requirements` table, indexes, and RLS |
| `lib/validation.ts` | Modify | File size (< 1 MB) and MIME type / extension validation helpers |
| `app/admin/trips/actions.ts` | Modify | Extend `createTripAction` to save trip document requirements |
| `app/admin/trips/create/page.tsx` | Modify | Add compact dropdown checkbox for document requirements |
| `app/admin/trips/[id]/page.tsx` | Modify | Display trip document requirements and minimal in-app document preview modal |
| `components/ui/DocumentPreviewModal.tsx` | Create | Minimal in-app modal viewer for images and PDFs using signed URLs |
| `app/employee/dashboard/page.tsx` | Modify | Remove misleading global document counter; inject per-trip compliance status |
| `components/trips/EmployeeTripCard.tsx` | Modify | Display per-trip document completion status badge and navigation to trip details |
| `app/employee/trips/[id]/page.tsx` | Create | Employee trip details page with trip-specific document upload dropzone, status, and replace action |
| `app/employee/trips/actions.ts` | Create | Server actions for secure document upload (< 1 MB validation) and signed URL generation |
| `docs/logs/2026-10-13.md` | Create / Modify | Daily development progress log |

---

## 6. Verification Checklist (Phase 1)

1. [ ] `public.trip_document_requirements` table created with RLS enabled.
2. [ ] Admin Create Trip form renders compact dropdown checkbox with Passport, Visa, Ticket, Govt ID, Hotel, Insurance, Other.
3. [ ] No mandatory/optional badges or descriptions present in dropdown.
4. [ ] Submitting trip creation saves selected requirements to database.
5. [ ] Employee dashboard no longer displays global `X/Y Documents Verified` counter.
6. [ ] Employee trip card displays dynamic per-trip completion badge.
7. [ ] `/employee/trips/[id]` displays only requirements for that specific trip.
8. [ ] Uploading file $\ge 1\text{ MB}$ is rejected by both client and server validation.
9. [ ] Unsupported formats are rejected.
10. [ ] Valid file $< 1\text{ MB}$ uploads to private `travel-documents` bucket and reflects as uploaded.
11. [ ] Replacing a document replaces the file in storage and updates the record.
12. [ ] Minimal in-app modal previews images and PDFs with signed URLs without forced download or verbose inspection headers.
13. [ ] `npm run build` succeeds with zero errors across all routes.
