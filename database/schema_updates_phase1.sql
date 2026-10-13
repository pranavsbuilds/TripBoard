-- ==============================================================================
-- TripBoard: Phase 1 Schema Migration — Travel Document Management
-- Deploy via: Supabase Dashboard > SQL Editor > New Query > Run
-- ==============================================================================

-- ==============================================================================
-- 1. UPDATE public.documents TABLE
-- Add storage_path column and expand document_type check constraint.
-- ==============================================================================

-- Add storage_path column to store canonical private bucket object key
alter table public.documents
  add column if not exists storage_path text;

-- Drop existing document_type constraint and recreate with gov_id
alter table public.documents
  drop constraint if exists documents_document_type_check;

alter table public.documents
  add constraint documents_document_type_check
  check (document_type in ('passport', 'visa', 'ticket', 'gov_id', 'hotel', 'insurance', 'other'));

-- ==============================================================================
-- 2. CREATE public.trip_document_requirements TABLE
-- Stores admin-configured required document types per trip.
-- ==============================================================================

create table if not exists public.trip_document_requirements (
  id            uuid        default gen_random_uuid() primary key,
  trip_id       uuid        references public.trips(id) on delete cascade not null,
  document_type text        not null,
  title         text        not null,
  is_mandatory  boolean     default true not null,
  created_at    timestamptz default timezone('utc'::text, now()) not null,
  unique (trip_id, document_type),
  constraint trip_doc_reqs_type_check
    check (document_type in ('passport', 'visa', 'ticket', 'gov_id', 'hotel', 'insurance', 'other'))
);

create index if not exists idx_trip_doc_reqs_trip
  on public.trip_document_requirements(trip_id);

-- ==============================================================================
-- 3. ENABLE RLS ON trip_document_requirements
-- ==============================================================================

alter table public.trip_document_requirements enable row level security;

-- Admin: full CRUD scoped to own company's trips
drop policy if exists "trip_doc_reqs_admin_crud" on public.trip_document_requirements;
create policy "trip_doc_reqs_admin_crud"
  on public.trip_document_requirements
  for all
  using (
    public.is_admin()
    and trip_id in (select id from public.trips where company_id = public.get_current_company_id())
  )
  with check (
    public.is_admin()
    and trip_id in (select id from public.trips where company_id = public.get_current_company_id())
  );

-- Employee: select only for assigned trips (or admin viewing own company)
drop policy if exists "trip_doc_reqs_employee_select" on public.trip_document_requirements;
create policy "trip_doc_reqs_employee_select"
  on public.trip_document_requirements
  for select
  using (
    trip_id in (select public.get_my_assigned_trip_ids())
    or (
      public.is_admin()
      and trip_id in (select id from public.trips where company_id = public.get_current_company_id())
    )
  );

-- ==============================================================================
-- 4. STORAGE BUCKET VERIFICATION NOTE
-- Run in Supabase Dashboard > Storage to confirm bucket settings:
--   bucket name : travel-documents
--   public      : false   (private — all access via signed URLs)
--   file_size_limit : 1048575  (1 MB - 1 byte; enforced in application layer)
--   allowed_mime_types : application/pdf, image/jpeg, image/png, image/webp
--
-- If bucket does not exist, create via Supabase Dashboard > Storage > New Bucket
--   or via API: supabase.storage.createBucket('travel-documents', { public: false })
-- ==============================================================================
