create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  name text not null,
  industry text not null,
  segment text,
  country text,
  city text,
  account_type text,
  key_plants text[],
  epc_consultants text[],
  installed_base_notes text,
  target_pumps numeric default 0,
  target_seals numeric default 0,
  target_hex numeric default 0,
  target_service numeric default 0,
  target_spares numeric default 0,
  owner_name text,
  last_visit_date date
);
alter table accounts enable row level security;
drop policy if exists "accounts_v1_read" on accounts;
create policy "accounts_v1_read" on accounts for select using (true);
drop policy if exists "accounts_v1_write" on accounts;
create policy "accounts_v1_write" on accounts for all using (true) with check (true);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  account_id uuid references accounts(id) on delete cascade,
  full_name text not null,
  title text,
  department text,
  email text,
  phone text,
  role_in_purchase text,
  influence_level text
);
alter table contacts enable row level security;
drop policy if exists "contacts_v1_read" on contacts;
create policy "contacts_v1_read" on contacts for select using (true);
drop policy if exists "contacts_v1_write" on contacts;
create policy "contacts_v1_write" on contacts for all using (true) with check (true);

create table if not exists visit_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  account_id uuid references accounts(id),
  visit_date date not null,
  visit_purpose text not null,
  process_unit text,
  equipment_discussed text[],
  contacts_met text[],
  operating_problem text,
  competitor_at_site text,
  customer_pain_point text,
  opportunity_potential text,
  next_action text,
  next_action_owner text,
  next_action_deadline date,
  visit_status text default 'planned',
  attachments text[],
  converted_to_enquiry boolean default false
);
alter table visit_reports enable row level security;
drop policy if exists "visit_reports_v1_read" on visit_reports;
create policy "visit_reports_v1_read" on visit_reports for select using (true);
drop policy if exists "visit_reports_v1_write" on visit_reports;
create policy "visit_reports_v1_write" on visit_reports for all using (true) with check (true);

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  enquiry_number text unique not null,
  account_id uuid references accounts(id),
  visit_report_id uuid references visit_reports(id),
  project_name text,
  equipment_type text not null,
  process_data text,
  required_delivery_weeks integer,
  bid_due_date date,
  competitor text,
  probability integer default 20,
  status text default 'open'
);
alter table enquiries enable row level security;
drop policy if exists "enquiries_v1_read" on enquiries;
create policy "enquiries_v1_read" on enquiries for select using (true);
drop policy if exists "enquiries_v1_write" on enquiries;
create policy "enquiries_v1_write" on enquiries for all using (true) with check (true);

create table if not exists rfqs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  rfq_number text unique not null,
  enquiry_id uuid references enquiries(id),
  account_id uuid references accounts(id),
  technical_requirement text,
  scope text,
  bid_due_date date,
  clarification_log text,
  commercial_terms text,
  bid_bond_required boolean default false,
  compliance_matrix_notes text,
  status text default 'received'
);
alter table rfqs enable row level security;
drop policy if exists "rfqs_v1_read" on rfqs;
create policy "rfqs_v1_read" on rfqs for select using (true);
drop policy if exists "rfqs_v1_write" on rfqs;
create policy "rfqs_v1_write" on rfqs for all using (true) with check (true);

create table if not exists quotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  quotation_number text unique not null,
  rfq_id uuid references rfqs(id),
  account_id uuid references accounts(id),
  equipment_selection text,
  bom_summary text,
  cost_usd numeric,
  selling_price_usd numeric,
  margin_pct numeric,
  delivery_weeks integer,
  warranty_months integer default 12,
  payment_terms text,
  commercial_deviation text,
  status text default 'draft',
  submitted_date date,
  result text
);
alter table quotations enable row level security;
drop policy if exists "quotations_v1_read" on quotations;
create policy "quotations_v1_read" on quotations for select using (true);
drop policy if exists "quotations_v1_write" on quotations;
create policy "quotations_v1_write" on quotations for all using (true) with check (true);

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  enquiry_id uuid references enquiries(id),
  account_id uuid references accounts(id),
  title text not null,
  stage text not null default 'Target Account',
  product_line text,
  industry text,
  value_usd numeric,
  probability integer default 10,
  expected_close_date date,
  competitor text,
  notes text,
  ai_score numeric,
  ai_score_source text,
  ai_score_confidence numeric,
  ai_score_review_status text default 'unreviewed'
);
alter table opportunities enable row level security;
drop policy if exists "opportunities_v1_read" on opportunities;
create policy "opportunities_v1_read" on opportunities for select using (true);
drop policy if exists "opportunities_v1_write" on opportunities;
create policy "opportunities_v1_write" on opportunities for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  action text not null,
  table_name text not null,
  row_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text
);
alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

-- Realtime: let a second browser tab pick up changes without a refresh.
-- Guarded so the migration still applies if the publication doesn't exist.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table
      accounts, contacts, visit_reports, enquiries, rfqs, quotations, opportunities;
  end if;
exception when duplicate_object then
  null;
end $$;

insert into accounts (id, name, industry, segment, country, city, account_type, key_plants, epc_consultants, owner_name, target_pumps, target_seals, target_hex, target_service) values
  ('a1000000-0000-0000-0000-000000000001', 'Petronas Refinery Kerteh', 'Oil & Gas', 'Downstream', 'Malaysia', 'Kerteh', 'End User', ARRAY['CDU Train 2', 'Hydrogen Unit'], ARRAY['Worley', 'Technip'], 'Ahmad Faris', 800000, 200000, 150000, 250000),
  ('a1000000-0000-0000-0000-000000000002', 'BASF Kuantan Chemical Complex', 'Chemical', 'Petrochemical', 'Malaysia', 'Kuantan', 'End User', ARRAY['Plant A', 'Utilities Block'], ARRAY['Linde Engineering'], 'Siti Rahimah', 600000, 180000, 300000, 120000),
  ('a1000000-0000-0000-0000-000000000003', 'Tenaga Nasional Prai Power', 'Power', 'Generation', 'Malaysia', 'Prai', 'End User', ARRAY['Boiler Feed Pump House', 'Cooling Tower'], ARRAY['Black & Veatch'], 'David Lim', 400000, 80000, 200000, 300000),
  ('a1000000-0000-0000-0000-000000000004', 'Pfizer Shah Alam', 'Pharma', 'API Manufacturing', 'Malaysia', 'Shah Alam', 'End User', ARRAY['API Block 3', 'CIP Loop'], ARRAY['GEA Group'], 'Nurul Izzah', 150000, 50000, 180000, 90000);

insert into contacts (id, account_id, full_name, title, department, email, influence_level, role_in_purchase) values
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Ir. Rashdan Mokhtar', 'Senior Rotating Equipment Engineer', 'Maintenance', 'rashdan@petronas.example', 'High', 'Technical Approver'),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Puan Suraya Hamid', 'Procurement Manager', 'SCM', 'suraya@petronas.example', 'High', 'Commercial Decision Maker'),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'Dr. Klaus Werner', 'Process Engineer', 'Engineering', 'kwerner@basf.example', 'Medium', 'Technical Influencer'),
  ('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', 'Encik Zaharuddin', 'Plant Engineer', 'Operations', 'zaharuddin@tnb.example', 'Medium', 'End User');

insert into visit_reports (id, account_id, visit_date, visit_purpose, process_unit, equipment_discussed, contacts_met, operating_problem, competitor_at_site, customer_pain_point, opportunity_potential, next_action, next_action_owner, next_action_deadline, visit_status, converted_to_enquiry) values
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '2025-05-12', 'Follow-up on seal failure in CDU', 'CDU Train 2', ARRAY['Mechanical Seal', 'Pump'], ARRAY['Ir. Rashdan Mokhtar'], 'High vibration on boiler feed pump; seal flush plan inadequate', 'Flowserve', 'Unplanned shutdown risk — seal MTBF under 6 months', 'Firm', 'Submit seal upgrade proposal with Plan 54 flush', 'Ahmad Faris', '2025-05-26', 'done', true),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', '2025-05-20', 'Technical presentation — heat exchanger range', 'Utilities Block', ARRAY['Heat Exchanger', 'Gasket'], ARRAY['Dr. Klaus Werner'], 'Fouling on existing gasketed plate HEX causing efficiency loss', 'Alfa Laval', 'Energy cost increase due to HEX fouling; no spare plate pack onsite', 'Budgetary', 'Provide plate pack quotation and cleaning proposal', 'Siti Rahimah', '2025-06-02', 'done', false),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', '2025-06-03', 'Installed base audit — pump house', 'Boiler Feed Pump House', ARRAY['Pump', 'Coupling'], ARRAY['Encik Zaharuddin'], 'Three BFPs approaching 10-year overhaul interval simultaneously', 'KSB', 'Budget constraint — needs phased overhaul plan with performance guarantee', 'Budgetary', 'Submit phased service proposal for 3 BFPs', 'David Lim', '2025-06-15', 'done', false),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', '2025-06-10', 'Spec-in discussion for new project', 'Hydrogen Unit', ARRAY['Pump', 'Mechanical Seal'], ARRAY['Ir. Rashdan Mokhtar', 'Puan Suraya Hamid'], 'New H2 service pump spec not yet finalised', 'Sundyne', 'Pressure to finalise spec before FEED freeze', 'Firm', 'Submit technical comparison and draft spec sheet', 'Ahmad Faris', '2025-06-20', 'planned', false);

insert into enquiries (id, enquiry_number, account_id, visit_report_id, project_name, equipment_type, process_data, required_delivery_weeks, bid_due_date, competitor, probability, status) values
  ('e1000000-0000-0000-0000-000000000001', 'ENQ-2025-0041', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'CDU Seal Upgrade', 'Mechanical Seal', 'Hydrocarbon service, 180°C, 12 bar, API 682 Plan 54', 10, '2025-07-01', 'Flowserve', 65, 'open'),
  ('e1000000-0000-0000-0000-000000000002', 'ENQ-2025-0042', 'a1000000-0000-0000-0000-000000000002', null, 'HEX Plate Pack Replacement', 'Heat Exchanger', 'Cooling water / process fluid, AISI 316, 2.5 bar', 6, '2025-07-15', 'Alfa Laval', 40, 'open'),
  ('e1000000-0000-0000-0000-000000000003', 'ENQ-2025-0043', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'BFP Overhaul Program', 'Service', 'Three BFPs, each 2MW, 10-year overhaul', 24, '2025-08-01', 'KSB', 50, 'open');

insert into rfqs (id, rfq_number, enquiry_id, account_id, technical_requirement, scope, bid_due_date, status) values
  ('d1000000-0000-0000-0000-000000000001', 'RFQ-2025-0031', 'e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'API 682 Category 3 dual seal, Plan 54, Inconel 718 spring', 'Supply 4 sets + commissioning support', '2025-07-01', 'received'),
  ('d1000000-0000-0000-0000-000000000002', 'RFQ-2025-0032', 'e1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'Complete hydraulic overhaul to OEM spec, performance test', 'Overhaul 3 BFPs in phased schedule; 12-month performance warranty', '2025-08-01', 'received');

insert into opportunities (id, enquiry_id, account_id, title, stage, product_line, industry, value_usd, probability, expected_close_date, competitor) values
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'CDU Seal Upgrade — 4 sets API 682', 'RFQ Issued', 'Seals', 'Oil & Gas', 95000, 65, '2025-08-15', 'Flowserve'),
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'BASF Plate Pack Replacement', 'Technical Discussion', 'Heat Exchangers', 'Chemical', 42000, 40, '2025-09-01', 'Alfa Laval'),
  ('f1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'TNB BFP Phased Overhaul x3', 'Quotation Submitted', 'Service', 'Power', 220000, 55, '2025-10-01', 'KSB'),
  ('f1000000-0000-0000-0000-000000000004', null, 'a1000000-0000-0000-0000-000000000004', 'Pfizer CIP Pump Replacement', 'Planned Visit', 'Pumps', 'Pharma', 28000, 20, '2025-11-30', 'Grundfos');