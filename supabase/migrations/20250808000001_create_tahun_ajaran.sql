create table tahun_ajaran (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Hanya satu tahun ajaran aktif
create unique index idx_tahun_ajaran_active
  on tahun_ajaran (is_active) where is_active = true and deleted_at is null;

-- Seed tahun ajaran pertama
insert into tahun_ajaran (nama, is_active) values ('2025/2026', true);
