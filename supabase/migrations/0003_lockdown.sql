-- Sprint 6 lock-down: profiles + roles, owner-scoped write policies.
-- Reads stay public so the demo keeps working; writes require an account.
-- Paste into the Supabase SQL editor and Run (safe to re-run).

-- ── profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  email text,
  full_name text,
  role text not null default 'sales_engineer'
    check (role in ('sales_engineer','application_engineer','sales_manager','finance','director'))
);
alter table public.profiles enable row level security;

drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data->>'role' in
        ('sales_engineer','application_engineer','sales_manager','finance','director')
      then new.raw_user_meta_data->>'role'
      else 'sales_engineer'
    end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role lookup usable inside policies without RLS recursion.
create or replace function public.user_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ── owner-scoped writes on all domain tables ─────────────────────────────────
-- select stays open (demo). insert requires a session (owner set by default).
-- update: owner, unowned seed rows, or sales_manager. delete: owner / seed only.
do $$
declare t text;
begin
  foreach t in array array
    ['accounts','contacts','visit_reports','enquiries','rfqs','quotations','opportunities']
  loop
    execute format('alter table public.%I alter column user_id set default auth.uid()', t);
    execute format('drop policy if exists "%s_v1_write" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert_auth" on public.%I', t, t);
    execute format(
      'create policy "%s_insert_auth" on public.%I for insert to authenticated with check (auth.uid() is not null)',
      t, t);
    execute format('drop policy if exists "%s_update_scoped" on public.%I', t, t);
    execute format(
      'create policy "%s_update_scoped" on public.%I for update to authenticated using (user_id = auth.uid() or user_id is null or public.user_role() = ''sales_manager'')',
      t, t);
    execute format('drop policy if exists "%s_delete_scoped" on public.%I', t, t);
    execute format(
      'create policy "%s_delete_scoped" on public.%I for delete to authenticated using (user_id = auth.uid() or user_id is null)',
      t, t);
  end loop;
end $$;

-- ── audit log: append-only, authenticated ────────────────────────────────────
alter table public.audit_logs alter column user_id set default auth.uid();
drop policy if exists "audit_logs_v1_write" on public.audit_logs;
drop policy if exists "audit_logs_v1_read" on public.audit_logs;
drop policy if exists "audit_logs_read_auth" on public.audit_logs;
create policy "audit_logs_read_auth" on public.audit_logs
  for select to authenticated using (true);
drop policy if exists "audit_logs_insert_auth" on public.audit_logs;
create policy "audit_logs_insert_auth" on public.audit_logs
  for insert to authenticated with check (true);
-- no update/delete policies: audit rows are immutable
