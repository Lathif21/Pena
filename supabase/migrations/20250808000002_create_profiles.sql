create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('kepala_guru', 'tentor', 'siswa', 'wali_murid')),
  nama_lengkap text not null,
  email text not null,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_profiles_role on profiles(role) where deleted_at is null;
create index idx_profiles_tahun_ajaran on profiles(tahun_ajaran_id);
