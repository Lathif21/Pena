-- Create new storage bucket for modules without mime type restrictions
insert into storage.buckets (id, name, public, file_size_limit)
values (
  'modules',
  'modules',
  false,
  52428800
) on conflict (id) do nothing;

-- Drop existing policies
drop policy if exists "KG can upload modules" on storage.objects;
drop policy if exists "Authenticated users can read modules" on storage.objects;
drop policy if exists "KG can delete modules" on storage.objects;

-- Policy: Allow kepala_guru to upload
create policy "KG can upload modules"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'modules'
  and (auth.jwt() ->> 'role') = 'kepala_guru'
);

-- Policy: Allow authenticated users to read
create policy "Authenticated users can read modules"
on storage.objects
for select
to authenticated
using (bucket_id = 'modules');

-- Policy: Allow kepala_guru to delete
create policy "KG can delete modules"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'modules'
  and (auth.jwt() ->> 'role') = 'kepala_guru'
);
