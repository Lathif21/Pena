-- Menutup akses langsung ke bucket presensi-foto dan modul-pdf.
--
-- Policy sebelumnya hanya memeriksa `bucket_id`, tanpa memeriksa siapa
-- pemanggilnya. Karena izinnya diberikan ke role `authenticated`, setiap user
-- yang login — termasuk siswa — bisa:
--
--   * mengunduh foto presensi tentor mana pun (foto itu memuat lokasi dan waktu
--     tentor), terbukti 200 dengan token siswa biasa
--   * mengunduh modul PDF mana pun langsung, melewati signed URL, termasuk yang
--     masih berstatus draft dan belum dipublish
--   * melihat daftar isi bucket
--
-- Penggantinya bukan policy yang lebih ketat, melainkan tidak ada policy sama
-- sekali. Alasannya: seluruh akses storage di aplikasi ini memakai
-- `supabaseAdmin` (service_role), yang melewati RLS, dan pembacaan oleh pengguna
-- memakai signed URL yang diotorisasi tanda tangannya — bukan oleh RLS. Jadi
-- role `anon` dan `authenticated` tidak pernah butuh izin apa pun di sini.
--
-- Menulis policy "hanya pemilik sesi" akan terlihat lebih aman tapi sebenarnya
-- kode mati: tidak ada satu pun jalur di aplikasi yang akan mengevaluasinya.

drop policy if exists "Tentor upload presensi foto" on storage.objects;
drop policy if exists "Tentor update presensi foto" on storage.objects;
drop policy if exists "Baca presensi foto" on storage.objects;

-- Policy untuk modul-pdf dibuat lewat dashboard, jadi namanya tidak diketahui
-- di sini. Disapu berdasarkan isi definisinya, dan hanya yang menyebut kedua
-- bucket ini — bucket lain tidak tersentuh.
do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (coalesce(qual, '') || ' ' || coalesce(with_check, ''))
          like any (array['%presensi-foto%', '%modul-pdf%'])
  loop
    execute format('drop policy if exists %I on storage.objects', p.policyname);
    raise notice 'policy dicabut: %', p.policyname;
  end loop;
end $$;
