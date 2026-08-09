-- Materi (topics within a mapel)
create table materi (
  id uuid primary key default gen_random_uuid(),
  mapel_id uuid not null references mapel(id),
  nama text not null,
  nomor_urut smallint not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index idx_unique_materi_per_mapel on materi(mapel_id, nomor_urut) where deleted_at is null;
create index idx_materi_mapel on materi(mapel_id) where deleted_at is null;

-- Sub Materi (topics within a materi)
create table sub_materi (
  id uuid primary key default gen_random_uuid(),
  materi_id uuid not null references materi(id),
  nama text not null,
  nomor_urut smallint not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index idx_unique_sub_materi_per_materi on sub_materi(materi_id, nomor_urut) where deleted_at is null;
create index idx_sub_materi_materi on sub_materi(materi_id) where deleted_at is null;
