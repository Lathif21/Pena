-- Attempt (one row per try out or latihan session)
create table attempt (
  id uuid primary key default gen_random_uuid(),
  siswa_detail_id uuid not null references siswa_detail(id),
  try_out_id uuid references try_out(id),
  sub_materi_id uuid references sub_materi(id),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  nilai integer check (nilai between 0 and 100),
  is_active boolean not null default true,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (num_nonnulls(try_out_id, sub_materi_id) = 1)
);

create index idx_attempt_siswa_detail on attempt(siswa_detail_id) where deleted_at is null;
create index idx_attempt_try_out on attempt(try_out_id) where deleted_at is null;
create index idx_attempt_sub_materi on attempt(sub_materi_id) where deleted_at is null;
create index idx_attempt_tahun_ajaran on attempt(tahun_ajaran_id) where deleted_at is null;
create index idx_attempt_is_active on attempt(is_active) where deleted_at is null;

-- Jawaban Siswa (one row per question per attempt)
create table jawaban_siswa (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempt(id),
  soal_id uuid not null references soal(id),
  pilihan_jawaban_id uuid references pilihan_jawaban(id),
  created_at timestamptz not null default now(),
  unique (attempt_id, soal_id)
);

create index idx_jawaban_siswa_attempt on jawaban_siswa(attempt_id);
create index idx_jawaban_siswa_soal on jawaban_siswa(soal_id);
