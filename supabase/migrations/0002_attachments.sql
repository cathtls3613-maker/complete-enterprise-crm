-- Visit report attachments: public storage bucket + demo-open policies.
-- Paste into the Supabase SQL editor and Run (safe to re-run).

insert into storage.buckets (id, name, public)
values ('visit-attachments', 'visit-attachments', true)
on conflict (id) do nothing;

drop policy if exists "visit_attachments_read" on storage.objects;
create policy "visit_attachments_read" on storage.objects
  for select using (bucket_id = 'visit-attachments');

drop policy if exists "visit_attachments_insert" on storage.objects;
create policy "visit_attachments_insert" on storage.objects
  for insert with check (bucket_id = 'visit-attachments');

drop policy if exists "visit_attachments_delete" on storage.objects;
create policy "visit_attachments_delete" on storage.objects
  for delete using (bucket_id = 'visit-attachments');
