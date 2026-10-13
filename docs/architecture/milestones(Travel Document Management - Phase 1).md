# Milestones: Travel Document Management (Phase 1)

**Feature Branch:** `feature/doc-management-phase1`  
**Reference Plan:** [`docs/architecture/implementation_plan(Travel Document Management - Phase 1).md`](file:///c:/projects/TripBoard/docs/architecture/implementation_plan(Travel Document Management - Phase 1).md)  
**Reference Design:** [`docs/designs/trip-creation-and-card-preview.html`](file:///c:/projects/TripBoard/docs/designs/trip-creation-and-card-preview.html)  

---

## Milestone 1: Database Schema, Storage Bucket & Validation Helpers

**Scope:**
- Create `public.trip_document_requirements` table with PostgreSQL Row Level Security (RLS) policies.
- Update `public.documents` table with `storage_path` column and proper document type validation (`passport`, `visa`, `ticket`, `gov_id`, `hotel`, `insurance`, `other`).
- Verify private Supabase Storage bucket `travel-documents`.
- Update `lib/validation.ts` with strict $< 1\text{ MB}$ file size and MIME-type validation helpers.

**Recommended Model:** `Gemini 3.1 Pro (High)`  
*Rationale: Deep PostgreSQL RLS rule formulation, schema migration integrity, and data constraint safety.*

**Files Table:**
| File | Action |
|---|---|
| `database/schema_updates_phase1.sql` | CREATE |
| `lib/validation.ts` | MODIFY |

**Gate ✅ — ACHIEVED:**
- [x] Table `trip_document_requirements` created with RLS — `database/schema_updates_phase1.sql` ready to deploy.
- [x] Bucket `travel-documents` private setup documented in SQL migration comments.
- [x] `validateTravelDocument`, `MAX_DOC_FILE_SIZE`, `ALLOWED_DOC_MIME_TYPES` added to `lib/validation.ts`.

---

## Milestone 2: Admin Trip Document Requirements Configuration

**Scope:**
- Extend the trip creation form (`app/admin/trips/create/page.tsx`) with a compact dropdown checkbox for "Required Travel Documents" matching [`docs/designs/trip-creation-and-card-preview.html`](file:///c:/projects/TripBoard/docs/designs/trip-creation-and-card-preview.html).
- Provide clean checkbox options for: Passport, Visa, Flight Ticket, Government ID Proof, Hotel Booking, Travel Insurance, Other.
- Exclude mandatory/optional tags and verbose descriptions to keep the section minimal and non-intrusive.
- Update `createTripAction` in `app/admin/trips/actions.ts` to accept `requiredDocuments: string[]` and insert records into `public.trip_document_requirements`.
- Preserve existing group and individual dual-budget allocation logic and traveler assignment flows.

**Recommended Model:** `Gemini 3.8 Flash (High)`  
*Rationale: Multi-state component generation, form validation, and transactional Supabase server actions.*

**Files Table:**
| File | Action |
|---|---|
| `app/admin/trips/actions.ts` | MODIFY |
| `app/admin/trips/create/page.tsx` | MODIFY |

**Gate ✅ — ACHIEVED:**
- [x] Admin can select document types from the compact dropdown checkbox in the Create Trip form.
- [x] No mandatory/optional badges or descriptions clutter the form.
- [x] Submitting the form successfully passes `requiredDocuments` and inserts records into `public.trip_document_requirements`.
- [x] Verified via production build compilation (`next build` 0 errors).

---

## Milestone 3: Employee Trip-Specific Uploads & Document Vault

**Scope:**
- Remove the misleading global `X/Y Documents Verified` counter and global document action banner from `app/employee/dashboard/page.tsx`.
- Update `components/trips/EmployeeTripCard.tsx` to compute completion status dynamically per trip and link to `/employee/trips/[id]`.
- Implement `app/employee/trips/[id]/page.tsx` displaying the specific documents required for that trip by the Admin.
- Create `app/employee/trips/actions.ts` with `uploadTripDocumentAction`:
  - Enforce strict $< 1\text{ MB}$ file size validation (reject $\ge 1\text{ MB}$ with 400 error).
  - Enforce strict MIME whitelist (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`).
  - Upload file to private Supabase bucket `travel-documents`.
  - Upsert record in `public.documents` and update trip completion metrics.
- Support viewing and replacing uploaded documents.

**Recommended Model:** `Gemini 3.8 Flash (High)`  
*Rationale: Full-stack asynchronous orchestration, FormData handling, private cloud storage upload, and dynamic UI state.*

**Files Table:**
| File | Action |
|---|---|
| `app/employee/dashboard/page.tsx` | MODIFY |
| `components/trips/EmployeeTripCard.tsx` | MODIFY |
| `app/employee/trips/[id]/page.tsx` | CREATE |
| `app/employee/trips/actions.ts` | CREATE |

**Gate ✅:**
- [ ] Employee dashboard no longer displays the global documents verified counter.
- [ ] Opening `/employee/trips/[id]` displays only requirements configured for that trip.
- [ ] Uploading a file $\ge 1\text{ MB}$ or unsupported format is rejected with clear error message.
- [ ] Valid file $< 1\text{ MB}$ uploads to private storage bucket and updates trip document status to "Uploaded".
- [ ] Overall completion count for that specific trip recalculates dynamically.

---

## Milestone 4: Admin In-App Minimal Document Preview Modal

**Scope:**
- Create `components/ui/DocumentPreviewModal.tsx` for minimal in-app viewing of uploaded images and PDFs matching [`docs/designs/trip-creation-and-card-preview.html`](file:///c:/projects/TripBoard/docs/designs/trip-creation-and-card-preview.html).
- Exclude verbose inspection headlines or explanatory banners; keep header minimal (file name, traveler name, document type, close button).
- Implement `getDocumentSignedUrlAction` generating short-lived authenticated signed URLs (3600 seconds) from the private `travel-documents` bucket.
- Update Admin trip details page (`app/admin/trips/[id]/page.tsx`) to display uploaded documents with a "View Document" button.
- Render image files in a native `<img>` canvas and PDF documents in an embedded `<iframe src="${signedUrl}#toolbar=0" />` viewer.
- Provide a clean close button returning to the screen without triggering a file download.

**Recommended Model:** `Gemini 3.7 Flash (High)`  
*Rationale: Clean UI modal engineering, iframe sandboxing, and secure signed URL binding.*

**Files Table:**
| File | Action |
|---|---|
| `components/ui/DocumentPreviewModal.tsx` | CREATE |
| `app/admin/trips/[id]/page.tsx` | MODIFY |

**Gate ✅:**
- [ ] Admin clicks "View Document" on the trip details screen.
- [ ] Minimal in-app modal opens and renders image or PDF without verbose inspection text or forcing browser download.
- [ ] Signed URL generated is authenticated and time-bounded.
- [ ] Closing the preview returns smoothly to the previous view.

---

## Milestone 5: Phase 1 Integration Testing & Build Verification

**Scope:**
- Verify end-to-end trip creation $\rightarrow$ requirement definition $\rightarrow$ employee upload $\rightarrow$ admin preview workflow.
- Verify file size restriction ($\ge 1\text{ MB}$ rejection) and MIME validation on both frontend and backend.
- Run complete production build check (`npm run build`) ensuring zero TypeScript or lint errors.
- Document session progress in `docs/logs/2026-10-13.md`.

**Recommended Model:** `Gemini 3.8 Flash (High)`  
*Rationale: Cross-subsystem integration verification and compilation diagnostics.*

**Files Table:**
| File | Action |
|---|---|
| `docs/logs/2026-10-13.md` | MODIFY |

**Gate ✅:**
- [ ] `npm run build` compiles with 0 errors across all routes.
- [ ] All document upload, restriction, and preview workflows operate smoothly.

---

## Phase 1 Summary Table

| # | Milestone | Status | Model | New Files | Modified Files |
|:---:|---|:---:|---|:---:|:---:|
| 1 | Database Schema, Storage Bucket & Validation Helpers | ✅ Done | Gemini 3.1 Pro (High) | 1 | 1 |
| 2 | Admin Trip Document Requirements Configuration | ✅ Done | Gemini 3.8 Flash (High) | 0 | 2 |
| 3 | Employee Trip-Specific Uploads & Document Vault | ⏳ Next | Gemini 3.8 Flash (High) | 2 | 2 |
| 4 | Admin In-App Minimal Document Preview Modal | — | Gemini 3.7 Flash (High) | 1 | 1 |
| 5 | Phase 1 Integration Testing & Build Verification | — | Gemini 3.8 Flash (High) | 0 | 1 |

---

## Phase 2 Roadmap (Deferred to Subsequent Stage)

Once Phase 1 is completed and approved, Phase 2 will execute:
- **Milestone 2.1:** Academic Resources Metadata Schema & Idempotent Seed (`database/seed_academic_resources.sql`)
- **Milestone 2.2:** Home Page Academic Sections (`View Assignments` [8] & `View Experiments` [10])
- **Milestone 2.3:** In-App PDF Reader Modal & Missing File Handling
- **Milestone 2.4:** Phase 2 End-to-End Verification
