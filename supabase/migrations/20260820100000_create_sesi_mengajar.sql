-- Sesi Mengajar — satu sesi = satu kelas pada satu waktu.
-- Tentor yang mengajar tiga kelas dalam sehari membuka dan menutup tiga sesi terpisah.
--
-- Foto presensi tentor tidak disimpan di sini, hanya path-nya. File-nya ada di
-- bucket privat `presensi-foto` (lihat migrasi bucket).
create table sesi_mengajar (
  id uuid primary key default gen_random_uuid(),
  tentor_id uuid not null references profiles(id),
  kelas_id uuid not null references kelas(id),
  mapel_id uuid not null references mapel(id),
  foto_path text not null,
  -- uploaded_at sengaja terpisah dari timestamp yang terbakar di dalam foto:
  -- selisih keduanya yang memberi tahu KG apakah unggahan tepat waktu atau telat.
  uploaded_at timestamptz not null default now(),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'open' check (status in ('open', 'closed')),
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_sesi_tentor on sesi_mengajar(tentor_id);
create index idx_sesi_kelas on sesi_mengajar(kelas_id);
create index idx_sesi_status on sesi_mengajar(status) where deleted_at is null;
create index idx_sesi_tahun_ajaran on sesi_mengajar(tahun_ajaran_id) where deleted_at is null;

-- CLI Supabase versi baru tidak lagi mengekspos tabel baru ke Data API secara
-- otomatis, jadi tanpa GRANT ini setiap query balas "permission denied for table".
-- Otorisasi tetap sepenuhnya di endpoint /api/* — proyek ini belum memakai RLS.
grant all privileges on table sesi_mengajar to anon, authenticated, service_role;
