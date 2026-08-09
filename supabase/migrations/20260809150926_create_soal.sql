-- Soal (Questions)
create table soal (
  id uuid primary key default gen_random_uuid(),
  sub_materi_id uuid references sub_materi(id),
  materi_id uuid references materi(id),
  pertanyaan text not null,
  nomor_urut integer not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (num_nonnulls(sub_materi_id, materi_id) = 1)
);

create index idx_soal_sub_materi_id on soal(sub_materi_id) where deleted_at is null;
create index idx_soal_materi_id on soal(materi_id) where deleted_at is null;

-- Pilihan Jawaban (Answer Choices)
create table pilihan_jawaban (
  id uuid primary key default gen_random_uuid(),
  soal_id uuid not null references soal(id),
  teks text not null,
  is_benar boolean not null default false,
  nomor_urut integer not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_pilihan_jawaban_soal_id on pilihan_jawaban(soal_id) where deleted_at is null;
