-- Ganti scoping berbasis `tingkat` dengan relasi many-to-many mapel <-> kelas.
--
-- Alasan: satu mapel bisa dipakai oleh beberapa kelas, dan satu kelas punya
-- beberapa mapel. Relasi eksplisit lebih jelas daripada mencocokkan angka
-- tingkat, dan menghilangkan kebutuhan kolom `tingkat` di beberapa tabel.

create table mapel_kelas (
  mapel_id uuid not null references mapel(id),
  kelas_id uuid not null references kelas(id),
  created_at timestamptz not null default now(),
  primary key (mapel_id, kelas_id)
);

create index idx_mapel_kelas_kelas on mapel_kelas(kelas_id);

-- `tingkat` tidak lagi dipakai. Kolom ini hanya pernah terpasang di `mapel`
-- (percobaan penambahan di `kelas` dan `siswa_detail` tidak pernah ter-apply).
alter table mapel drop column if exists tingkat;
alter table kelas drop column if exists tingkat;
alter table siswa_detail drop column if exists tingkat;
