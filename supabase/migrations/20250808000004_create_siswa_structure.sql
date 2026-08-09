-- Extend profiles untuk siswa
create table siswa_detail (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id),
  nis text not null unique,
  paket text not null check (paket in ('regular', 'privat')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_siswa_detail_profile on siswa_detail(profile_id);
create index idx_siswa_detail_paket on siswa_detail(paket) where deleted_at is null;

-- Siswa reguler → kelas
create table siswa_kelas (
  id uuid primary key default gen_random_uuid(),
  siswa_detail_id uuid not null references siswa_detail(id),
  kelas_id uuid not null references kelas(id),
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (siswa_detail_id, kelas_id, tahun_ajaran_id)
);

create index idx_siswa_kelas_kelas on siswa_kelas(kelas_id);
create index idx_siswa_kelas_tahun on siswa_kelas(tahun_ajaran_id);

-- Tentor → kelas + mapel
create table tentor_kelas_mapel (
  id uuid primary key default gen_random_uuid(),
  tentor_id uuid not null references profiles(id),
  kelas_id uuid not null references kelas(id),
  mapel_id uuid not null references mapel(id),
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tentor_id, kelas_id, mapel_id, tahun_ajaran_id)
);

create index idx_tkm_tentor on tentor_kelas_mapel(tentor_id);
create index idx_tkm_kelas on tentor_kelas_mapel(kelas_id);
create index idx_tkm_mapel on tentor_kelas_mapel(mapel_id);

-- Siswa privat → tentor + mapel (tanpa kelas)
create table tentor_siswa_privat (
  id uuid primary key default gen_random_uuid(),
  siswa_detail_id uuid not null references siswa_detail(id),
  tentor_id uuid not null references profiles(id),
  mapel_id uuid not null references mapel(id),
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (siswa_detail_id, tentor_id, mapel_id, tahun_ajaran_id)
);

create index idx_tsp_siswa on tentor_siswa_privat(siswa_detail_id);
create index idx_tsp_tentor on tentor_siswa_privat(tentor_id);

-- Wali → siswa (multi-anak)
create table wali_siswa (
  id uuid primary key default gen_random_uuid(),
  wali_id uuid not null references profiles(id),
  siswa_detail_id uuid not null references siswa_detail(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (wali_id, siswa_detail_id)
);

create index idx_wali_siswa_wali on wali_siswa(wali_id);
create index idx_wali_siswa_siswa on wali_siswa(siswa_detail_id);
