-- Presensi Murid — satu baris per siswa per sesi, supaya riwayat kehadiran
-- seorang siswa bisa ditanya langsung lewat siswa_detail_id.
--
-- Siswa privat tidak pernah muncul di sini: mereka tidak punya kelas, dan
-- presensi selalu diturunkan dari siswa_kelas.
create table presensi_murid (
  id uuid primary key default gen_random_uuid(),
  sesi_id uuid not null references sesi_mengajar(id),
  siswa_detail_id uuid not null references siswa_detail(id),
  is_hadir boolean not null,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  -- Satu siswa hanya boleh punya satu baris per sesi. Ini juga yang dipakai
  -- sebagai target upsert saat tentor mengoreksi centang selagi sesi masih open.
  unique (sesi_id, siswa_detail_id)
);

create index idx_presensi_siswa on presensi_murid(siswa_detail_id);
create index idx_presensi_sesi on presensi_murid(sesi_id);

-- Jurnal Mengajar — wajib ada sebelum sesi boleh ditutup.
create table jurnal_mengajar (
  id uuid primary key default gen_random_uuid(),
  -- unique, bukan dicek di aplikasi: tepat satu jurnal per sesi dijamin database.
  sesi_id uuid not null references sesi_mengajar(id) unique,
  materi_id uuid not null references materi(id),
  deskripsi text not null,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  submitted_at timestamptz,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_jurnal_materi on jurnal_mengajar(materi_id);
create index idx_jurnal_status on jurnal_mengajar(status) where deleted_at is null;
create index idx_jurnal_tahun_ajaran on jurnal_mengajar(tahun_ajaran_id) where deleted_at is null;

grant all privileges on table presensi_murid to anon, authenticated, service_role;
grant all privileges on table jurnal_mengajar to anon, authenticated, service_role;
