-- ==============================================================================
-- TripBoard Demo Seed Script
-- Provisions 1 Demo Company, 1 Demo Admin, 3 Demo Employees, Sample Trips, 
-- Assignments & Travel Documents for local development & demonstration.
-- ==============================================================================

-- 1. Ensure pgcrypto extension is available for bcrypt hashing
create extension if not exists pgcrypto with schema extensions;

do $$
declare
  v_company_id uuid := 'c1000000-0000-0000-0000-000000000001';
  v_admin_id uuid := 'a1000000-0000-0000-0000-000000000001';
  v_emp1_uid uuid := 'e1000000-0000-0000-0000-000000000001';
  v_emp2_uid uuid := 'e1000000-0000-0000-0000-000000000002';
  v_emp3_uid uuid := 'e1000000-0000-0000-0000-000000000003';

  v_emp1_id uuid := 'ee000000-0000-0000-0000-000000000001';
  v_emp2_id uuid := 'ee000000-0000-0000-0000-000000000002';
  v_emp3_id uuid := 'ee000000-0000-0000-0000-000000000003';

  v_trip1_id uuid := 'b1000000-0000-0000-0000-000000000001';
  v_trip2_id uuid := 'b2000000-0000-0000-0000-000000000002';

  -- Pre-hashed password for 'Demo@1234' (bcrypt cost 10 matching GoTrue)
  v_hashed_pw text := extensions.crypt('Demo@1234', extensions.gen_salt('bf', 10));
begin
  -- --------------------------------------------------------------------------
  -- 2. DEMO COMPANY
  -- --------------------------------------------------------------------------
  insert into public.companies (id, name, domain)
  values (
    v_company_id,
    'TripBoard Tech India Pvt. Ltd.',
    'tripboard.in'
  )
  on conflict (id) do update set
    name = excluded.name,
    domain = excluded.domain;

  -- --------------------------------------------------------------------------
  -- 3. AUTH.USERS & AUTH.IDENTITIES (Supabase GoTrue)
  -- --------------------------------------------------------------------------
  -- 3a. Admin: admin@tripboard.in
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    is_anonymous, is_sso_user, confirmation_token, recovery_token,
    email_change_token_new, email_change, email_change_token_current, phone_change,
    phone_change_token, reauthentication_token, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_admin_id,
    'authenticated',
    'authenticated',
    'admin@tripboard.in',
    v_hashed_pw,
    now(),
    false,
    false,
    '', '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"sub":"a1000000-0000-0000-0000-000000000001","email":"admin@tripboard.in","email_verified":true,"phone_verified":false,"full_name":"Vikramaditya Singhania","role":"admin"}'::jsonb,
    now(),
    now()
  )
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    is_anonymous = excluded.is_anonymous,
    is_sso_user = excluded.is_sso_user,
    email_change = '',
    email_change_token_new = '',
    email_change_token_current = '',
    confirmation_token = '',
    recovery_token = '',
    phone_change = '',
    phone_change_token = '',
    reauthentication_token = '',
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data;

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  values (
    v_admin_id,
    v_admin_id,
    v_admin_id::text,
    json_build_object('sub', v_admin_id::text, 'email', 'admin@tripboard.in'),
    'email',
    now(),
    now()
  )
  on conflict (provider, provider_id) do update set
    identity_data = excluded.identity_data;

  -- 3b. Employee 1: rahul.sharma@tripboard.in (Coordinator)
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    is_anonymous, is_sso_user, confirmation_token, recovery_token,
    email_change_token_new, email_change, email_change_token_current, phone_change,
    phone_change_token, reauthentication_token, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_emp1_uid,
    'authenticated',
    'authenticated',
    'rahul.sharma@tripboard.in',
    v_hashed_pw,
    now(),
    false,
    false,
    '', '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"sub":"e1000000-0000-0000-0000-000000000001","email":"rahul.sharma@tripboard.in","email_verified":true,"phone_verified":false,"full_name":"Rahul Sharma","role":"employee"}'::jsonb,
    now(),
    now()
  )
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    is_anonymous = excluded.is_anonymous,
    is_sso_user = excluded.is_sso_user,
    email_change = '',
    email_change_token_new = '',
    email_change_token_current = '',
    confirmation_token = '',
    recovery_token = '',
    phone_change = '',
    phone_change_token = '',
    reauthentication_token = '',
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data;

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  values (
    v_emp1_uid,
    v_emp1_uid,
    v_emp1_uid::text,
    json_build_object('sub', v_emp1_uid::text, 'email', 'rahul.sharma@tripboard.in'),
    'email',
    now(),
    now()
  )
  on conflict (provider, provider_id) do update set
    identity_data = excluded.identity_data;

  -- 3c. Employee 2: priya.patel@tripboard.in
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    is_anonymous, is_sso_user, confirmation_token, recovery_token,
    email_change_token_new, email_change, email_change_token_current, phone_change,
    phone_change_token, reauthentication_token, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_emp2_uid,
    'authenticated',
    'authenticated',
    'priya.patel@tripboard.in',
    v_hashed_pw,
    now(),
    false,
    false,
    '', '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"sub":"e1000000-0000-0000-0000-000000000002","email":"priya.patel@tripboard.in","email_verified":true,"phone_verified":false,"full_name":"Priya Patel","role":"employee"}'::jsonb,
    now(),
    now()
  )
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    is_anonymous = excluded.is_anonymous,
    is_sso_user = excluded.is_sso_user,
    email_change = '',
    email_change_token_new = '',
    email_change_token_current = '',
    confirmation_token = '',
    recovery_token = '',
    phone_change = '',
    phone_change_token = '',
    reauthentication_token = '',
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data;

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  values (
    v_emp2_uid,
    v_emp2_uid,
    v_emp2_uid::text,
    json_build_object('sub', v_emp2_uid::text, 'email', 'priya.patel@tripboard.in'),
    'email',
    now(),
    now()
  )
  on conflict (provider, provider_id) do update set
    identity_data = excluded.identity_data;

  -- 3d. Employee 3: amit.verma@tripboard.in
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    is_anonymous, is_sso_user, confirmation_token, recovery_token,
    email_change_token_new, email_change, email_change_token_current, phone_change,
    phone_change_token, reauthentication_token, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_emp3_uid,
    'authenticated',
    'authenticated',
    'amit.verma@tripboard.in',
    v_hashed_pw,
    now(),
    false,
    false,
    '', '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"sub":"e1000000-0000-0000-0000-000000000003","email":"amit.verma@tripboard.in","email_verified":true,"phone_verified":false,"full_name":"Amit Verma","role":"employee"}'::jsonb,
    now(),
    now()
  )
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    is_anonymous = excluded.is_anonymous,
    is_sso_user = excluded.is_sso_user,
    email_change = '',
    email_change_token_new = '',
    email_change_token_current = '',
    confirmation_token = '',
    recovery_token = '',
    phone_change = '',
    phone_change_token = '',
    reauthentication_token = '',
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data;

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  values (
    v_emp3_uid,
    v_emp3_uid,
    v_emp3_uid::text,
    json_build_object('sub', v_emp3_uid::text, 'email', 'amit.verma@tripboard.in'),
    'email',
    now(),
    now()
  )
  on conflict (provider, provider_id) do update set
    identity_data = excluded.identity_data;

  -- --------------------------------------------------------------------------
  -- 4. PUBLIC.PROFILES
  -- --------------------------------------------------------------------------
  insert into public.profiles (id, company_id, full_name, email, role, phone, department)
  values 
    (v_admin_id, v_company_id, 'Vikramaditya Singhania', 'admin@tripboard.in', 'admin', '+91 98765 43210', 'Management'),
    (v_emp1_uid, v_company_id, 'Rahul Sharma', 'rahul.sharma@tripboard.in', 'employee', '+91 98111 22334', 'Engineering'),
    (v_emp2_uid, v_company_id, 'Priya Patel', 'priya.patel@tripboard.in', 'employee', '+91 98222 33445', 'Product & Design'),
    (v_emp3_uid, v_company_id, 'Amit Verma', 'amit.verma@tripboard.in', 'employee', '+91 98333 44556', 'Sales & Partnerships')
  on conflict (id) do update set
    company_id = excluded.company_id,
    full_name = excluded.full_name,
    role = excluded.role,
    phone = excluded.phone,
    department = excluded.department;

  -- Also link any pre-existing admin to demo company
  update public.profiles set company_id = v_company_id where email = 'parthsutar3012@gmail.com';

  -- --------------------------------------------------------------------------
  -- 5. PUBLIC.EMPLOYEES
  -- --------------------------------------------------------------------------
  insert into public.employees (
    id, company_id, user_id, employee_code, full_name, email, phone,
    department, designation, status, passport_number
  )
  values
    (
      v_emp1_id, v_company_id, v_emp1_uid, 'EMP-001', 'Rahul Sharma',
      'rahul.sharma@tripboard.in', '+91 98111 22334', 'Engineering',
      'Lead Systems Architect', 'active', 'Z1234567'
    ),
    (
      v_emp2_id, v_company_id, v_emp2_uid, 'EMP-002', 'Priya Patel',
      'priya.patel@tripboard.in', '+91 98222 33445', 'Product & Design',
      'Senior Product Manager', 'active', 'Z2345678'
    ),
    (
      v_emp3_id, v_company_id, v_emp3_uid, 'EMP-003', 'Amit Verma',
      'amit.verma@tripboard.in', '+91 98333 44556', 'Sales & Partnerships',
      'Enterprise Account Executive', 'active', 'Z3456789'
    )
  on conflict (id) do update set
    company_id = excluded.company_id,
    user_id = excluded.user_id,
    employee_code = excluded.employee_code,
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    department = excluded.department,
    designation = excluded.designation,
    status = excluded.status;

  -- --------------------------------------------------------------------------
  -- 6. PUBLIC.TRIPS
  -- --------------------------------------------------------------------------
  -- Trip 1: Bengaluru Tech Summit (Upcoming)
  insert into public.trips (
    id, company_id, title, destination, country, purpose, start_date, end_date,
    budget_inr, group_budget_inr, individual_budget_inr, status, notes,
    created_by, coordinator_id
  )
  values (
    v_trip1_id,
    v_company_id,
    'Q4 Tech Architecture Summit',
    'Bengaluru, Karnataka',
    'India',
    'Engineering & Product Alignment',
    '2026-10-15',
    '2026-10-20',
    225000.00,
    150000.00,
    25000.00,
    'upcoming',
    'Annual technology summit and strategic roadmap discussions.',
    v_admin_id,
    v_emp1_id
  )
  on conflict (id) do update set
    title = excluded.title,
    destination = excluded.destination,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    budget_inr = excluded.budget_inr,
    group_budget_inr = excluded.group_budget_inr,
    individual_budget_inr = excluded.individual_budget_inr,
    status = excluded.status,
    coordinator_id = excluded.coordinator_id;

  -- Trip 2: Mumbai Enterprise Roadshow (In Progress)
  insert into public.trips (
    id, company_id, title, destination, country, purpose, start_date, end_date,
    budget_inr, group_budget_inr, individual_budget_inr, status, notes,
    created_by, coordinator_id
  )
  values (
    v_trip2_id,
    v_company_id,
    'Enterprise Client Partnership Roadshow',
    'Mumbai, Maharashtra',
    'India',
    'Client Roadshow & Sales Meetings',
    '2026-10-05',
    '2026-10-12',
    130000.00,
    90000.00,
    20000.00,
    'in_progress',
    'Strategic client expansion meetings with enterprise financial clients.',
    v_admin_id,
    v_emp2_id
  )
  on conflict (id) do update set
    title = excluded.title,
    destination = excluded.destination,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    budget_inr = excluded.budget_inr,
    group_budget_inr = excluded.group_budget_inr,
    individual_budget_inr = excluded.individual_budget_inr,
    status = excluded.status,
    coordinator_id = excluded.coordinator_id;

  -- --------------------------------------------------------------------------
  -- 7. PUBLIC.TRIP_ASSIGNMENTS
  -- --------------------------------------------------------------------------
  -- Trip 1 Travelers: Rahul (Coordinator), Priya, Amit
  insert into public.trip_assignments (trip_id, employee_id, is_coordinator)
  values 
    (v_trip1_id, v_emp1_id, true),
    (v_trip1_id, v_emp2_id, false),
    (v_trip1_id, v_emp3_id, false)
  on conflict (trip_id, employee_id) do update set
    is_coordinator = excluded.is_coordinator;

  -- Trip 2 Travelers: Priya (Coordinator), Amit
  insert into public.trip_assignments (trip_id, employee_id, is_coordinator)
  values 
    (v_trip2_id, v_emp2_id, true),
    (v_trip2_id, v_emp3_id, false)
  on conflict (trip_id, employee_id) do update set
    is_coordinator = excluded.is_coordinator;

  -- --------------------------------------------------------------------------
  -- 8. PUBLIC.DOCUMENTS (Travel Compliance)
  -- --------------------------------------------------------------------------
  insert into public.documents (
    id, employee_id, trip_id, document_type, file_name, file_url,
    file_size_bytes, status, verified_by
  )
  values
    (
      'd1000000-0000-0000-0000-000000000001',
      v_emp1_id,
      v_trip1_id,
      'passport',
      'rahul_passport_copy.pdf',
      'https://sfdkdebfeispylbfpwmy.supabase.co/storage/v1/object/public/documents/demo/rahul_passport.pdf',
      245000,
      'verified',
      v_admin_id
    ),
    (
      'd1000000-0000-0000-0000-000000000002',
      v_emp1_id,
      v_trip1_id,
      'ticket',
      'blr_flight_ticket_roundtrip.pdf',
      'https://sfdkdebfeispylbfpwmy.supabase.co/storage/v1/object/public/documents/demo/blr_ticket.pdf',
      180000,
      'verified',
      v_admin_id
    ),
    (
      'd1000000-0000-0000-0000-000000000003',
      v_emp2_id,
      v_trip1_id,
      'passport',
      'priya_passport_scan.pdf',
      'https://sfdkdebfeispylbfpwmy.supabase.co/storage/v1/object/public/documents/demo/priya_passport.pdf',
      310000,
      'verified',
      v_admin_id
    ),
    (
      'd1000000-0000-0000-0000-000000000004',
      v_emp3_id,
      v_trip1_id,
      'insurance',
      'corporate_travel_insurance_policy.pdf',
      'https://sfdkdebfeispylbfpwmy.supabase.co/storage/v1/object/public/documents/demo/amit_insurance.pdf',
      120000,
      'pending',
      null
    )
  on conflict (id) do update set
    status = excluded.status,
    verified_by = excluded.verified_by;

end $$;
