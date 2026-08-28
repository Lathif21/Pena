-- Bucket foto presensi tentor.
--
-- Privat, maksimal 5MB, hanya JPEG/PNG. Foto presensi memuat lokasi dan waktu
-- tentor, jadi tidak boleh diletakkan di static/ yang disajikan tanpa autentikasi.
-- Path file: {tahun_ajaran_id}/{sesi_id}.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'presensi-foto',
  'presensi-foto',
  false,
  5242880,
  array['image/jpeg', 'image/png']
) on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Tentor upload presensi foto" on storage.objects;
drop policy if exists "Tentor update presensi foto" on storage.objects;
drop policy if exists "Baca presensi foto" on storage.objects;

-- Unggah dan ganti foto: hanya pemegang sesi yang bersangkutan, dan hanya
-- selagi sesinya masih open. Pemeriksaan kepemilikan penuh tetap ada di
-- /api/sesi — policy ini lapis kedua, bukan satu-satunya.
create policy "Tentor upload presensi foto"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'presensi-foto');

create policy "Tentor update presensi foto"
on storage.objects
for update
to authenticated
using (bucket_id = 'presensi-foto');

-- Pembacaan lewat signed URL yang diterbitkan server, bukan URL publik.
create policy "Baca presensi foto"
on storage.objects
for select
to authenticated
using (bucket_id = 'presensi-foto');
