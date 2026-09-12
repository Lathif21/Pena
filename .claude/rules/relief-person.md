---
paths:
  - "**/features/relief/**"
  - "**/routes/tentor/relief/**"
  - "**/routes/kepala-guru/monitoring/relief/**"
  - "**/routes/api/relief/**"
  - "**/lib/email/**"
  - "supabase/migrations/**"
---

# Relief Person

Tentor yang berhalangan menunjuk penggantinya sendiri, lalu sistem memberi tahu pengganti dan kepala guru lewat email.

Sisa pekerjaan Fase 4. Tidak menyentuh KPI, tidak menyentuh siswa privat.

## Relief Menunjuk Kelas + Mapel + Tanggal, Bukan Sesi

Proyek ini **tidak punya tabel jadwal**, dan `sesi_mengajar` baru lahir saat tentor mengunggah foto presensi. Saat relief diajukan, sesinya belum ada — jadi `sesi_id` tidak bisa dipakai sebagai acuan.

Relief menunjuk kombinasi `kelas_id + mapel_id + tanggal`. Sesi yang nanti dibuka pengganti pada tanggal itu adalah sesi yang dimaksud, dicocokkan saat pengganti membuka presensi.

## Baris Relief Adalah Otorisasi

`sesi-mengajar.md` mensyaratkan tentor terdaftar di `tentor_kelas_mapel` untuk membuka sesi. Tentor pengganti tidak ada di sana — tanpa penanganan khusus dia akan ditolak, dan fitur ini tidak berguna.

Karena itu endpoint pembuka sesi menerima **dua** jalur otorisasi:

1. Tentor terdaftar di `tentor_kelas_mapel` untuk kelas + mapel itu, **atau**
2. Ada baris `relief` aktif dengan `pengganti_id` = tentor pemanggil, `kelas_id` + `mapel_id` cocok, dan `tanggal` = hari ini

Jalur kedua **hanya berlaku pada tanggal yang tertulis**. Lewat tengah malam, izinnya habis dengan sendirinya — tidak perlu pencabutan manual.

Jalur ini membuka sesi saja. Semua aksi setelahnya (presensi murid, jurnal, selesai mengajar) tetap memakai pengecekan kepemilikan sesi yang sudah ada: pengganti memiliki sesi yang dia buka, jadi lolos secara alami.

## Yang Dilihat Pengganti

Saat membuka presensi diri untuk kelas relief, pengganti mendapat:

- **Daftar siswa** kelas itu, dari `siswa_kelas` — sama seperti tentor asli
- **Modul** mapel itu yang berstatus `published`, lewat jalur `mapel → materi → sub_materi → module`
- **Task delegasi** dari tentor asli, ditampilkan menonjol di halaman presensi

Karena tidak ada jadwal, sistem tidak bisa tahu materi mana yang seharusnya diajarkan hari itu. Tampilkan seluruh modul mapel tersebut dan biarkan pengganti memilih — task delegasi adalah tempat tentor asli menuliskan arahannya.

**Pengganti tidak melihat riwayat nilai siswa.** Dia menggantikan satu sesi, bukan mengambil alih kelas.

## Batasan

- **Satu sesi saja.** Satu baris relief = satu kelas + satu mapel + satu tanggal. Berhalangan dua hari berarti dua baris.
- **Hanya kelas reguler.** Siswa privat tidak punya kelas dan tidak masuk cakupan relief; koordinasinya di luar sistem.
- **Tidak memengaruhi KPI siapa pun.** Tentor asli tidak dihukum, pengganti tidak mendapat kredit. KPI membaca `jurnal` dan nilai pre/post-test, dan sesi relief tercatat atas nama pengganti — biarkan begitu, jangan tambahkan penyesuaian.
- **Pengganti harus tentor lain yang aktif.** Dropdown mengambil dari `profiles` role `tentor` dengan `deleted_at is null`, kecuali diri sendiri.
- Tanggal tidak boleh di masa lalu.

## Pembatalan

Tentor asli boleh membatalkan relief selama **belum ada sesi** yang dibuka lewat jalur itu. Setelah pengganti membuka sesi, relief terkunci — membatalkannya akan meninggalkan sesi tanpa dasar otorisasi.

Pembatalan mengirim email susulan ke pengganti dan kepala guru.

## Email

Satu-satunya fitur di Pena yang mengirim email. Notifikasi lain tetap in-app.

Alasannya: pengganti perlu tahu **sebelum** membuka aplikasi. Notifikasi in-app baru terlihat kalau dia kebetulan login, dan itu tidak cukup untuk sesuatu yang terjadi besok pagi.

Dua penerima per pengajuan: tentor pengganti dan kepala guru.

Isi email: nama tentor asli, kelas, mapel, tanggal, dan task delegasi. Tambahkan tautan langsung ke `/tentor/dashboard`.

**Kegagalan email tidak membatalkan relief.** Kalau SMTP gagal, baris relief tetap tersimpan dan pengganti tetap berwenang membuka sesi — catat kegagalannya di `relief.email_error` dan tampilkan peringatan ke tentor asli agar dia bisa mengabari manual. Menggagalkan seluruh pengajuan karena mail server sedang mati akan membuat fitur ini tidak bisa diandalkan justru saat dibutuhkan.

Kredensial SMTP lewat environment variable, server-only, tanpa prefix `PUBLIC_`.

## Schema

```sql
create table relief (
  id uuid primary key default gen_random_uuid(),
  tentor_asli_id uuid not null references profiles(id),
  pengganti_id uuid not null references profiles(id),
  kelas_id uuid not null references kelas(id),
  mapel_id uuid not null references mapel(id),
  tanggal date not null,
  task text not null,
  status text not null default 'aktif' check (status in ('aktif', 'dibatalkan')),
  email_error text,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (tentor_asli_id <> pengganti_id)
);

create index idx_relief_pengganti on relief(pengganti_id, tanggal)
  where status = 'aktif' and deleted_at is null;
create index idx_relief_asli on relief(tentor_asli_id);
create index idx_relief_tanggal on relief(tanggal) where deleted_at is null;

create unique index idx_relief_unik
  on relief (tentor_asli_id, kelas_id, mapel_id, tanggal)
  where status = 'aktif' and deleted_at is null;

grant all privileges on table relief to anon, authenticated, service_role;
```

Index `idx_relief_pengganti` menopang pengecekan otorisasi, yang berjalan setiap kali sesi dibuka — bentuknya sengaja dicocokkan ke query itu.

Unique index mencegah satu tentor mengajukan dua relief untuk kelas, mapel, dan tanggal yang sama.
