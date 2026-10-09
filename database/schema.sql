-- ==============================================================================
-- TripBoard: Multi-Tenant Database Schema & RLS
-- Deploy via: Supabase Dashboard > SQL Editor > New Query > Run
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. COMPANIES TABLE (Multi-Tenant Anchor)
-- ==============================================================================
create table if not exists public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  domain text unique,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

comment on table public.companies is 'Tenant organization entity isolating enterprise data.';

-- ==============================================================================
-- 3. PROFILES TABLE (Tied 1:1 to auth.users)
-- ==============================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  company_id uuid references public.companies(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text check (role in ('admin', 'employee')) default 'employee' not null,
  phone text default '+91',
  department text,
  avatar_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

comment on table public.profiles is 'Public user profile records managed alongside Supabase Auth.';

-- ==============================================================================
-- 4. EMPLOYEES DIRECTORY TABLE
-- ==============================================================================
create table if not exists public.employees (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null unique,
  employee_code text not null,
  full_name text not null,
  email text not null,
  phone text default '+91' not null,
  department text not null,
  designation text not null,
  status text check (status in ('active', 'on_trip', 'inactive')) default 'active' not null,
  passport_number text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  unique (company_id, employee_code),
  unique (company_id, email)
);

-- ==============================================================================
-- 5. TRIPS TABLE
-- ==============================================================================
create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  title text not null,
  destination text not null,
  country text default 'India' not null,
  purpose text not null,
  start_date date not null,
  end_date date not null,
  budget_inr numeric(12, 2) check (budget_inr >= 0) not null,
  group_budget_inr numeric(12, 2) check (group_budget_inr >= 0) default 0,
  individual_budget_inr numeric(12, 2) check (individual_budget_inr >= 0) default 0,
  status text check (status in ('upcoming', 'in_progress', 'completed', 'cancelled')) default 'upcoming' not null,
  notes text,
  created_by uuid references public.profiles(id) not null,
  coordinator_id uuid references public.employees(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  constraint trips_date_order check (end_date >= start_date)
);

-- ==============================================================================
-- 6. TRIP ASSIGNMENTS (Many-to-Many Bridge)
-- ==============================================================================
create table if not exists public.trip_assignments (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  employee_id uuid references public.employees(id) on delete cascade not null,
  is_coordinator boolean default false not null,
  assigned_at timestamptz default timezone('utc'::text, now()) not null,
  unique (trip_id, employee_id)
);

-- ==============================================================================
-- 7. TRAVEL DOCUMENTS TABLE
-- ==============================================================================
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.employees(id) on delete cascade not null,
  trip_id uuid references public.trips(id) on delete set null,
  document_type text check (document_type in ('passport', 'visa', 'ticket', 'hotel', 'insurance', 'other')) not null,
  file_name text not null,
  file_url text not null,
  file_size_bytes bigint check (file_size_bytes > 0),
  status text check (status in ('pending', 'verified', 'rejected')) default 'pending' not null,
  verified_by uuid references public.profiles(id),
  rejection_reason text,
  uploaded_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 8. PERFORMANCE INDEXES
-- ==============================================================================
create index if not exists idx_profiles_company on public.profiles(company_id);
create index if not exists idx_employees_company on public.employees(company_id);
create index if not exists idx_employees_user_id on public.employees(user_id);
create index if not exists idx_trips_company on public.trips(company_id);
create index if not exists idx_trips_coordinator on public.trips(coordinator_id);
create index if not exists idx_trips_dates on public.trips(start_date, end_date);
create index if not exists idx_trip_assignments_trip on public.trip_assignments(trip_id);
create index if not exists idx_trip_assignments_emp on public.trip_assignments(employee_id);
create index if not exists idx_documents_employee on public.documents(employee_id);
create index if not exists idx_documents_trip on public.documents(trip_id);

-- ==============================================================================
-- 9. SECURITY HELPER FUNCTIONS (security definer)
-- ==============================================================================

-- Returns the company_id of the currently authenticated user
create or replace function public.get_current_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid() limit 1;
$$;

-- Returns true if the authenticated user has role = 'admin'
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Returns the employees.id for the authenticated user
create or replace function public.get_current_employee_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.employees where user_id = auth.uid() limit 1;
$$;

-- Returns true if the authenticated user is the designated coordinator for a given trip
create or replace function public.is_trip_coordinator(p_trip_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.trips
    where id = p_trip_id and coordinator_id = public.get_current_employee_id()
  );
$$;

-- Returns set of trip_ids assigned to current authenticated employee (bypasses RLS recursion)
create or replace function public.get_my_assigned_trip_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select trip_id from public.trip_assignments
  where employee_id = (select id from public.employees where user_id = auth.uid() limit 1);
$$;


-- ==============================================================================
-- 10. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ==============================================================================
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.trips enable row level security;
alter table public.trip_assignments enable row level security;
alter table public.documents enable row level security;

-- ==============================================================================
-- 11. RLS POLICIES
-- ==============================================================================

-- COMPANIES
drop policy if exists "companies_view_own" on public.companies;
create policy "companies_view_own"
  on public.companies for select
  using (id = public.get_current_company_id());

-- PROFILES
drop policy if exists "profiles_select_policy" on public.profiles;
create policy "profiles_select_policy"
  on public.profiles for select
  using (
    auth.uid() = id
    or (public.is_admin() and company_id = public.get_current_company_id())
  );

drop policy if exists "profiles_update_policy" on public.profiles;
create policy "profiles_update_policy"
  on public.profiles for update
  using (
    auth.uid() = id
    or (public.is_admin() and company_id = public.get_current_company_id())
  );

-- EMPLOYEES
drop policy if exists "employees_select_policy" on public.employees;
create policy "employees_select_policy"
  on public.employees for select
  using (
    (public.is_admin() and company_id = public.get_current_company_id())
    or user_id = auth.uid()
  );

drop policy if exists "employees_admin_crud" on public.employees;
create policy "employees_admin_crud"
  on public.employees for all
  using (public.is_admin() and company_id = public.get_current_company_id())
  with check (public.is_admin() and company_id = public.get_current_company_id());

-- TRIPS
drop policy if exists "trips_select_policy" on public.trips;
create policy "trips_select_policy"
  on public.trips for select
  using (
    (public.is_admin() and company_id = public.get_current_company_id())
    or id in (select public.get_my_assigned_trip_ids())
  );

drop policy if exists "trips_admin_crud" on public.trips;
create policy "trips_admin_crud"
  on public.trips for all
  using (public.is_admin() and company_id = public.get_current_company_id())
  with check (public.is_admin() and company_id = public.get_current_company_id());

-- TRIP ASSIGNMENTS
drop policy if exists "assignments_select_policy" on public.trip_assignments;
create policy "assignments_select_policy"
  on public.trip_assignments for select
  using (
    (public.is_admin() and employee_id in (select id from public.employees where company_id = public.get_current_company_id()))
    or employee_id = public.get_current_employee_id()
    or trip_id in (select public.get_my_assigned_trip_ids())
  );

drop policy if exists "assignments_admin_crud" on public.trip_assignments;
create policy "assignments_admin_crud"
  on public.trip_assignments for all
  using (
    public.is_admin() and employee_id in (select id from public.employees where company_id = public.get_current_company_id())
  )
  with check (
    public.is_admin() and employee_id in (select id from public.employees where company_id = public.get_current_company_id())
  );

-- DOCUMENTS
drop policy if exists "documents_select_policy" on public.documents;
create policy "documents_select_policy"
  on public.documents for select
  using (
    (public.is_admin() and employee_id in (select id from public.employees where company_id = public.get_current_company_id()))
    or employee_id = public.get_current_employee_id()
    or (trip_id is not null and public.is_trip_coordinator(trip_id))
  );

drop policy if exists "documents_insert_policy" on public.documents;
create policy "documents_insert_policy"
  on public.documents for insert
  with check (
    (public.is_admin() and employee_id in (select id from public.employees where company_id = public.get_current_company_id()))
    or employee_id = public.get_current_employee_id()
  );

drop policy if exists "documents_update_policy" on public.documents;
create policy "documents_update_policy"
  on public.documents for update
  using (
    (public.is_admin() and employee_id in (select id from public.employees where company_id = public.get_current_company_id()))
    or (employee_id = public.get_current_employee_id() and status in ('pending', 'rejected'))
  );

drop policy if exists "documents_delete_policy" on public.documents;
create policy "documents_delete_policy"
  on public.documents for delete
  using (
    (public.is_admin() and employee_id in (select id from public.employees where company_id = public.get_current_company_id()))
    or (employee_id = public.get_current_employee_id() and status = 'pending')
  );

-- ==============================================================================
-- 12. AUTO-ASSIGN COORDINATOR TRIGGER
-- Auto-designates the first traveler on a trip as Trip Coordinator.
-- ==============================================================================
create or replace function public.auto_assign_single_traveler_coordinator()
returns trigger language plpgsql as $$
declare
  traveler_count int;
begin
  select count(*) into traveler_count
  from public.trip_assignments
  where trip_id = new.trip_id;

  -- First traveler on a trip: auto-designate as coordinator
  if traveler_count = 0 then
    new.is_coordinator := true;
    update public.trips set coordinator_id = new.employee_id where id = new.trip_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_single_coordinator on public.trip_assignments;
create trigger trg_auto_single_coordinator
  before insert on public.trip_assignments
  for each row execute procedure public.auto_assign_single_traveler_coordinator();

-- ==============================================================================
-- 13. UPDATED_AT TIMESTAMP TRIGGERS
-- ==============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at before update on public.profiles
  for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_employees_updated_at on public.employees;
create trigger touch_employees_updated_at before update on public.employees
  for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_trips_updated_at on public.trips;
create trigger touch_trips_updated_at before update on public.trips
  for each row execute procedure public.touch_updated_at();

drop trigger if exists touch_documents_updated_at on public.documents;
create trigger touch_documents_updated_at before update on public.documents
  for each row execute procedure public.touch_updated_at();

-- ==============================================================================
-- 14. HANDLE NEW USER TRIGGER
-- Syncs auth.users metadata into public.profiles on every new signup.
-- NOTE: company_id is null at creation; must be set during onboarding flow.
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    coalesce(new.raw_user_meta_data->>'role', 'employee')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
