-- Kelas
create table kelas (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Mata Pelajaran
create table mapel (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
