-- Nilai Manual (manual grades from paper exams)
create table nilai_manual (
  id uuid primary key default gen_random_uuid(),
  siswa_detail_id uuid not null references siswa_detail(id),
  mapel_id uuid not null references mapel(id),
  materi_id uuid references materi(id),
  tipe_test text not null check (tipe_test in ('pre_test', 'try_out', 'post_test')),
  judul text not null,
  tanggal date not null,
  nilai integer not null check (nilai between 0 and 100),
  catatan text,
  tentor_id uuid not null references profiles(id),
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_nilai_manual_siswa_detail on nilai_manual(siswa_detail_id) where deleted_at is null;
create index idx_nilai_manual_mapel on nilai_manual(mapel_id) where deleted_at is null;
create index idx_nilai_manual_tentor on nilai_manual(tentor_id) where deleted_at is null;
create index idx_nilai_manual_tahun_ajaran on nilai_manual(tahun_ajaran_id) where deleted_at is null;
