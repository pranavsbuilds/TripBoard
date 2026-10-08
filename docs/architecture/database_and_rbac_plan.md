# TripBoard Database Schema & Multi-Tenant RBAC Plan

**Database Engine:** **PostgreSQL** (Hosted on Supabase)  
**Security Model:** Row Level Security (RLS) with Multi-Tenancy (`company_id`)  
**Roles:** `admin` (Company-level), `employee` (Personal-level), `trip_coordinator` (Trip-level contextual role)  

---

## 1. Entity-Relationship Diagram

```
                      +-------------------+
                      | public.companies  |
                      |-------------------|
                      | id (UUID, PK)     |
                      | name (TEXT)       |
                      | domain (TEXT)     |
                      +-------------------+
                                │
          ┌─────────────────────┼─────────────────────┐
          │ 1:N                 │ 1:N                 │ 1:N
          ▼                     ▼                     ▼
+-------------------+ +-------------------+ +-------------------+
|  public.profiles  | | public.employees  | |   public.trips    |
|-------------------| |-------------------| |-------------------|
| id (UUID, PK)     | | id (UUID, PK)     | | id (UUID, PK)     |
| company_id (UUID) | | company_id (UUID) | | company_id (UUID) |
| full_name (TEXT)  | | user_id (UUID)    | | destination (TEXT)|
| role (admin/emp)  | | employee_code     | | coordinator_id(FK)|
+-------------------+ +-------------------+ +-------------------+
                                │                     │
                                │ 1:N                 │ 1:N
                                ▼                     ▼
                      +-----------------------------------+
                      |     public.trip_assignments       |
                      |-----------------------------------|
                      | id (UUID, PK)                     |
                      | trip_id (UUID, FK)                |
                      | employee_id (UUID, FK)            |
                      | is_coordinator (BOOLEAN)          |
                      +-----------------------------------+
                                │
                                │ 1:N
                                ▼
                      +-----------------------------------+
                      |         public.documents          |
                      |-----------------------------------|
                      | id (UUID, PK)                     |
                      | employee_id (UUID, FK)            |
                      | trip_id (UUID, FK)                |
                      | document_type (TEXT)              |
                      | file_url (TEXT)                   |
                      | status (pending/verified/rejected)|
                      +-----------------------------------+
```

---

## 2. Complete PostgreSQL DDL

```sql
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
  domain text unique, -- e.g. "acme.com"
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
```

---

## 3. Security Helper Functions (`security definer`)

```sql
-- 1. Get authenticated user's company_id
create or replace function public.get_current_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid() limit 1;
$$;

-- 2. Check if authenticated user is a company admin
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. Get the employee directory record associated with current user
create or replace function public.get_current_employee_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.employees where user_id = auth.uid() limit 1;
$$;

-- 4. Check if authenticated user is the designated Coordinator for a specific trip
create or replace function public.is_trip_coordinator(p_trip_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.trips
    where id = p_trip_id and coordinator_id = public.get_current_employee_id()
  );
$$;
```

---

## 4. Multi-Tenant Row Level Security (RLS) Policies

```sql
-- Enable RLS across all tables
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.trips enable row level security;
alter table public.trip_assignments enable row level security;
alter table public.documents enable row level security;

-- ==============================================================================
-- RLS: COMPANIES
-- ==============================================================================
create policy "companies_view_own"
  on public.companies for select
  using (id = public.get_current_company_id());

-- ==============================================================================
-- RLS: PROFILES
-- ==============================================================================
create policy "profiles_select_policy"
  on public.profiles for select
  using (
    auth.uid() = id 
    or (public.is_admin() and company_id = public.get_current_company_id())
  );

create policy "profiles_update_policy"
  on public.profiles for update
  using (
    auth.uid() = id 
    or (public.is_admin() and company_id = public.get_current_company_id())
  );

-- ==============================================================================
-- RLS: EMPLOYEES
-- ==============================================================================
-- Admins view all company employees; Employees view their own record
create policy "employees_select_policy"
  on public.employees for select
  using (
    (public.is_admin() and company_id = public.get_current_company_id())
    or user_id = auth.uid()
  );

-- Only Admins can insert/update/delete employees within their company
create policy "employees_admin_crud"
  on public.employees for all
  using (public.is_admin() and company_id = public.get_current_company_id())
  with check (public.is_admin() and company_id = public.get_current_company_id());

-- ==============================================================================
-- RLS: TRIPS
-- ==============================================================================
-- Admins view all company trips; Employees view assigned trips
create policy "trips_select_policy"
  on public.trips for select
  using (
    (public.is_admin() and company_id = public.get_current_company_id())
    or id in (
      select trip_id from public.trip_assignments
      where employee_id = public.get_current_employee_id()
    )
  );

-- Only Admins can create or modify company trips
create policy "trips_admin_crud"
  on public.trips for all
  using (public.is_admin() and company_id = public.get_current_company_id())
  with check (public.is_admin() and company_id = public.get_current_company_id());

-- ==============================================================================
-- RLS: TRIP ASSIGNMENTS
-- ==============================================================================
-- Admins view all; Coordinators & Travelers view their trip's roster
create policy "assignments_select_policy"
  on public.trip_assignments for select
  using (
    (public.is_admin() and trip_id in (select id from public.trips where company_id = public.get_current_company_id()))
    or employee_id = public.get_current_employee_id()
    or public.is_trip_coordinator(trip_id)
  );

create policy "assignments_admin_crud"
  on public.trip_assignments for all
  using (public.is_admin() and trip_id in (select id from public.trips where company_id = public.get_current_company_id()))
  with check (public.is_admin() and trip_id in (select id from public.trips where company_id = public.get_current_company_id()));

-- ==============================================================================
-- RLS: DOCUMENTS
-- ==============================================================================
-- Admins view all company docs; Coordinators view fellow travelers' docs; Employees view own docs
create policy "documents_select_policy"
  on public.documents for select
  using (
    (public.is_admin() and employee_id in (select id from public.employees where company_id = public.get_current_company_id()))
    or employee_id = public.get_current_employee_id()
    or (trip_id is not null and public.is_trip_coordinator(trip_id))
  );

-- Employees insert own docs; Admins insert for their company employees
create policy "documents_insert_policy"
  on public.documents for insert
  with check (
    (public.is_admin() and employee_id in (select id from public.employees where company_id = public.get_current_company_id()))
    or employee_id = public.get_current_employee_id()
  );

-- Admins verify/reject; Employees edit pending docs
create policy "documents_update_policy"
  on public.documents for update
  using (
    (public.is_admin() and employee_id in (select id from public.employees where company_id = public.get_current_company_id()))
    or (employee_id = public.get_current_employee_id() and status in ('pending', 'rejected'))
  );

-- Deletion permissions
create policy "documents_delete_policy"
  on public.documents for delete
  using (
    (public.is_admin() and employee_id in (select id from public.employees where company_id = public.get_current_company_id()))
    or (employee_id = public.get_current_employee_id() and status = 'pending')
  );
```

---

## 5. Automated Triggers

```sql
-- 1. Auto-Assign Trip Coordinator when only 1 traveler exists
create or replace function public.auto_assign_single_traveler_coordinator()
returns trigger language plpgsql as $$
declare
  traveler_count int;
begin
  select count(*) into traveler_count
  from public.trip_assignments
  where trip_id = new.trip_id;

  -- If this is the first and only traveler, auto-designate as coordinator
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

-- 2. Timestamp update triggers
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger touch_profiles_updated_at before update on public.profiles
  for each row execute procedure public.touch_updated_at();

create trigger touch_employees_updated_at before update on public.employees
  for each row execute procedure public.touch_updated_at();

create trigger touch_trips_updated_at before update on public.trips
  for each row execute procedure public.touch_updated_at();

create trigger touch_documents_updated_at before update on public.documents
  for each row execute procedure public.touch_updated_at();
```

---

## 6. Access Matrix

| Entity | Admin Role | Trip Coordinator Role | Employee Role |
|---|---|---|---|
| **`companies`** | SELECT (Own company) | SELECT (Own company) | SELECT (Own company) |
| **`profiles`** | Full CRUD (Own company users) | SELECT / UPDATE (Own record) | SELECT / UPDATE (Own record) |
| **`employees`** | Full CRUD (Company directory) | SELECT (Own record) | SELECT (Own record) |
| **`trips`** | Full CRUD (Company trips) | SELECT (Assigned trip) + Coordinator Console | SELECT (Assigned trips only) |
| **`trip_assignments`** | Full CRUD (Assign/unassign) | SELECT (Roster of assigned trip) | SELECT (Own assignments only) |
| **`documents`** | Full SELECT / UPDATE (Verify/Reject) | SELECT (Readiness of trip members) | SELECT / INSERT / DELETE (Own docs) |
