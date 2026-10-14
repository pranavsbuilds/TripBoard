# Milestones: Academic Resources (Phase 2)

**Feature Branch:** `feature/academic-resources-phase2`  
**Reference Plan:** [`docs/architecture/implementation_plan(Academic Resources - Phase 2).md`](file:///c:/projects/TripBoard/docs/architecture/implementation_plan(Academic Resources - Phase 2).md)  
**Reference Design:** [`docs/designs/academic-resources-preview.html`](file:///c:/projects/TripBoard/docs/designs/academic-resources-preview.html)  

---

## Milestone 1: Database Schema & Idempotent Seed Data

**Scope:**
- Create `public.academic_resources` table with Row Level Security (RLS) public read policies.
- Author `database/seed_academic_resources.sql` populating 8 assignments and 10 experiments with upsert semantics.
- Verify that re-executing the seed script does not create duplicate rows or produce primary key / unique constraint errors.
- Create directory structure for static assets: `public/home/Assignment/` and `public/home/Experiment/`.

**Recommended Model:** `Gemini 3.1 Pro (High)`  
*Rationale: PostgreSQL DDL migration, unique constraints, and idempotent upsert scripting.*

**Files Table:**
| File | Action |
|---|---|
| `database/seed_academic_resources.sql` | CREATE |

**Gate ✅:**
- [ ] Table `public.academic_resources` created and verified in Supabase.
- [ ] Seed script executes successfully, inserting exactly 8 assignments and 10 experiments.
- [ ] Second execution of seed script succeeds with 0 duplicate key errors.
- [ ] Direct query verifies sorting by `resource_number` ASC (1..8 and 1..10).

---

## Milestone 2: Reusable UI Component & In-App PDF Viewer Modal

**Scope:**
- Build `components/academic/AcademicResourcesSection.tsx` adhering to the Tailwind CSS design system (`primary-dark`, `primary-blue`, `gold-btn`, `bg-ice`, `rounded-xl`, `rounded-2xl`).
- Build `components/academic/PdfViewerModal.tsx` for embedded viewing of academic PDFs without forcing downloads.
- Implement graceful missing file detection: if the physical PDF file does not exist on disk, render an informative in-app placeholder card displaying the required target path (`public/home/...`) without crashing the application.
- Build `components/academic/AcademicHomeHub.tsx` to handle client-side modal state and user interactions.

**Recommended Model:** `Gemini 3.7 Flash (High)`  
*Rationale: High velocity component generation, faithful design matching with preview HTML, and clean state handling.*

**Files Table:**
| File | Action |
|---|---|
| `components/academic/AcademicResourcesSection.tsx` | CREATE |
| `components/academic/PdfViewerModal.tsx` | CREATE |
| `components/academic/AcademicHomeHub.tsx` | CREATE |

**Gate ✅:**
- [ ] Reusable section component renders correctly for both assignment and experiment data structures.
- [ ] Modal opens and closes smoothly with return navigation.
- [ ] In-app embedded reader streams PDFs or renders clear placeholder if file is pending placement.

---

## Milestone 3: Home Page Integration & Routing

**Scope:**
- Update `app/page.tsx` to fetch active resources from `public.academic_resources` ordered by `resource_number` ASC.
- Separate resources into 8 assignments and 10 experiments.
- Render the sections on the home page between the Hero section and the Features section.
- Add anchor links to the header navbar (`Assignments` and `Experiments`).
- Verify responsive layout on desktop, tablet, and mobile screen sizes.

**Recommended Model:** `Gemini 3.7 Flash (High)`  
*Rationale: Server component data fetching, layout composition, and responsive styling.*

**Files Table:**
| File | Action |
|---|---|
| `app/page.tsx` | MODIFY |

**Gate ✅:**
- [ ] Home page renders **View Assignments** section with 8 cards.
- [ ] Home page renders **View Experiments** section with 10 cards.
- [ ] Clicking any card's "View PDF" button opens the in-app viewer.
- [ ] Both sections render responsively on desktop and mobile viewports.

---

## Milestone 4: Phase 2 Integration Testing & Build Verification

**Scope:**
- Verify connectivity between database queries, component rendering, and in-app PDF modal viewer.
- Test PDF delivery with a sample PDF placed at `public/home/Assignment/Assignment_1.pdf`.
- Verify graceful fallback for missing files.
- Run complete production build check (`npm run build`) ensuring zero TypeScript or lint errors.
- Document session progress in `docs/logs/2026-10-14.md`.

**Recommended Model:** `Gemini 3.8 Flash (High)`  
*Rationale: Full end-to-end integration verification, static route analysis, and compilation check.*

**Files Table:**
| File | Action |
|---|---|
| `docs/logs/2026-10-14.md` | CREATE / MODIFY |

**Gate ✅:**
- [ ] `npm run build` exits with code 0 across all routes.
- [ ] All 18 academic resources display properly.
- [ ] In-app PDF viewer opens and closes seamlessly.

---

## Phase 2 Summary Table

| # | Milestone | Status | Model | New Files | Modified Files |
|:---:|---|:---:|---|:---:|:---:|
| 1 | Database Schema & Idempotent Seed Data | — | Gemini 3.1 Pro (High) | 1 | 0 |
| 2 | Reusable UI Component & In-App PDF Viewer Modal | — | Gemini 3.7 Flash (High) | 3 | 0 |
| 3 | Home Page Integration & Routing | — | Gemini 3.7 Flash (High) | 0 | 1 |
| 4 | Phase 2 Integration Testing & Build Verification | — | Gemini 3.8 Flash (High) | 0 | 1 |
