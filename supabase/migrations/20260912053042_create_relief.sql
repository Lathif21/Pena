-- Relief person — tentor yang berhalangan menunjuk penggantinya sendiri.
--
-- Relief menunjuk kombinasi kelas + mapel + tanggal, bukan sesi: proyek ini
-- tidak punya tabel jadwal, dan sesi_mengajar baru lahir saat pengganti
-- mengunggah foto presensi. Saat relief diajukan, sesinya belum ada.
create table relief (
  id uuid primary key default gen_random_uuid(),
  tentor_asli_id uuid not null references profiles(id),
  pengganti_id uuid not null references profiles(id),
  kelas_id uuid not null references kelas(id),
  mapel_id uuid not null references mapel(id),
  tanggal date not null,
  task text not null,
  status text not null default 'aktif' check (status in ('aktif', 'dibatalkan')),
  -- Kegagalan SMTP tidak membatalkan relief; pesannya disimpan di sini supaya
  -- tentor asli tahu dia perlu mengabari penggantinya secara manual.
  email_error text,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- Menunjuk diri sendiri sebagai pengganti tidak berarti apa-apa.
  check (tentor_asli_id <> pengganti_id)
);

-- Bentuknya sengaja dicocokkan ke query otorisasi, yang berjalan setiap kali
-- sesi dibuka: pengganti_id + tanggal, hanya baris aktif.
create index idx_relief_pengganti on relief(pengganti_id, tanggal)
  where status = 'aktif' and deleted_at is null;
create index idx_relief_asli on relief(tentor_asli_id);
create index idx_relief_tanggal on relief(tanggal) where deleted_at is null;

-- Satu tentor tidak boleh mengajukan dua relief untuk kelas, mapel, dan tanggal
-- yang sama. Parsial supaya pembatalan dan soft delete tidak ikut terhitung.
create unique index idx_relief_unik
  on relief (tentor_asli_id, kelas_id, mapel_id, tanggal)
  where status = 'aktif' and deleted_at is null;

-- CLI Supabase versi baru tidak mengekspos tabel baru ke Data API secara
-- otomatis. Tanpa grant ini setiap query balas "permission denied", sama
-- seperti tabel Fase 3.
grant all privileges on table relief to anon, authenticated, service_role;
