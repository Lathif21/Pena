-- Try Out
create table try_out (
  id uuid primary key default gen_random_uuid(),
  materi_id uuid not null references materi(id),
  judul text not null,
  tipe_test text not null check (tipe_test in ('biasa', 'pre_test', 'post_test')),
  waktu_buka timestamptz not null,
  durasi_menit integer not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_try_out_materi on try_out(materi_id) where deleted_at is null;
create index idx_try_out_tahun_ajaran on try_out(tahun_ajaran_id) where deleted_at is null;
create index idx_try_out_status on try_out(status) where deleted_at is null;

-- Try Out per Kelas (many-to-many)
create table try_out_kelas (
  try_out_id uuid not null references try_out(id),
  kelas_id uuid not null references kelas(id),
  primary key (try_out_id, kelas_id)
);

create index idx_try_out_kelas_kelas on try_out_kelas(kelas_id);
