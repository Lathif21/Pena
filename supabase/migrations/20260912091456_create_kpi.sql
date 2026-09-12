-- KPI tentor: konfigurasi bobot dan snapshot skor per periode.

-- Bobot tidak dimutasi di tempat, tiap perubahan jadi baris baru dengan
-- valid_from sendiri. Menghitung ulang periode lampau harus memakai bobot yang
-- berlaku saat itu — kalau ditimpa, skor masa lalu berubah tiap kali kepala
-- guru menyesuaikan bobot.
create table kpi_config (
  id uuid primary key default gen_random_uuid(),
  bobot_gain integer not null default 60,
  bobot_jurnal integer not null default 40,
  periode text not null default 'bulanan' check (periode in ('bulanan', 'semesteran')),
  valid_from date not null,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- Dijaga database, bukan hanya form: bobot yang tidak berjumlah 100 membuat
  -- skor tidak sebanding antar periode.
  check (bobot_gain + bobot_jurnal = 100)
);

create index idx_kpi_config_berlaku on kpi_config(tahun_ajaran_id, valid_from desc)
  where deleted_at is null;

-- Skor disimpan per periode, bukan dihitung ulang setiap halaman dibuka:
-- snapshot membuat riwayat murah dan menjaga skor lampau tetap stabil meski
-- konfigurasi berubah.
create table kpi_snapshot (
  id uuid primary key default gen_random_uuid(),
  tentor_id uuid not null references profiles(id),
  periode_mulai date not null,
  periode_selesai date not null,
  -- nullable: tentor tanpa sesi bernilai null, bukan 0. Skor nol menyiratkan
  -- kegagalan, padahal belum ada yang diukur.
  nilai_gain numeric(5,2),
  nilai_jurnal numeric(5,2),
  skor numeric(5,2) not null,
  -- Penyebut ikut disimpan supaya dashboard bisa menampilkannya. "67%" saja
  -- mengundang perdebatan; "67% (2 dari 3 sesi)" tidak.
  jumlah_siswa_dinilai integer not null,
  jumlah_sesi integer not null,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tentor_id, periode_mulai, tahun_ajaran_id)
);

create index idx_kpi_snapshot_tentor on kpi_snapshot(tentor_id, periode_mulai desc)
  where deleted_at is null;
create index idx_kpi_snapshot_periode on kpi_snapshot(tahun_ajaran_id, periode_mulai desc)
  where deleted_at is null;

-- CLI Supabase versi baru tidak mengekspos tabel baru ke Data API secara
-- otomatis. Tanpa grant ini setiap query balas "permission denied".
grant all privileges on table kpi_config to anon, authenticated, service_role;
grant all privileges on table kpi_snapshot to anon, authenticated, service_role;
