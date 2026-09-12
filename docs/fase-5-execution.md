# Fase 5 — Runtutan Eksekusi

KPI tentor, dashboard overview, rekap tahun ajaran, dan export laporan.

Prasyarat: Fase 0–4 selesai, termasuk relief person.

**Commit setiap selesai satu langkah.** `git add . ; git commit -m "feat: <langkah>"`

---

## Langkah 0 — Siapkan Data Lewat Alur Aplikasi

KPI membaca nilai `pre_test` dan `post_test` serta jurnal mengajar. Tanpa data itu, seluruh dashboard KPI akan nol dan kamu tidak bisa membedakan "rumusnya salah" dari "datanya memang kosong".

**Jangan insert langsung ke tabel.** Data yang ditembak lewat SQL melewati validasi endpoint, tidak punya `sesi_mengajar` yang menyertainya, dan menghasilkan kombinasi yang tidak pernah muncul di pemakaian nyata — lalu KPI-mu diuji terhadap keadaan yang tidak ada. Lewati alur aplikasi supaya bug validasi ikut ketahuan sekarang, bukan nanti.

Jalankan `npm run dev`, lalu ikuti urutan ini di browser.

### 0a. Pastikan prasyarat ada

Login sebagai **kepala guru**:

```
Master Data → Kelas       : minimal 1 kelas, misal "5A"
Master Data → Mata Pelajaran : minimal 1 mapel terhubung ke kelas itu
Akun → Tentor             : minimal 2 tentor (untuk membandingkan KPI)
Akun → Siswa              : minimal 4 siswa reguler di kelas itu
Assignment                : tentor A → kelas 5A + Matematika
```

Empat siswa itu jumlah minimum yang berguna: dengan satu siswa, rata-rata Normalized Gain tidak bermakna apa-apa.

### 0b. Nilai pre-test — jalur tercepat

Login sebagai **tentor A**, buka **Nilai → Input Nilai**:

```
Mapel      : Matematika
Tipe Test  : Pre-Test
Judul      : "Pre-Test Aljabar"
Tanggal    : awal periode, misal 3 minggu lalu
Nilai      : beri nilai yang BERBEDA-BEDA per siswa
             contoh: 40, 55, 70, 85
```

Variasi itu penting. Kalau semua siswa diberi nilai sama, kamu tidak akan melihat bahwa Normalized Gain memang mengompensasi nilai awal yang tinggi — yang merupakan seluruh alasan rumus itu dipakai.

Lewat form ini satu submit mengisi semua siswa sekaligus, jadi ini jalur tercepat yang tetap sah.

### 0c. Sesi mengajar dan jurnal

Masih sebagai **tentor A**, jalankan siklus sesi penuh **3–4 kali**:

```
1. Presensi Diri   → pilih kelas + mapel, unggah foto apa pun
2. Presensi Murid  → centang kehadiran
3. Jurnal Mengajar → pilih materi, isi deskripsi, simpan draft
4. Selesai Mengajar → konfirmasi
```

**Sengaja lewatkan jurnal di salah satu sesi.** Buka sesi, isi presensi, lalu jangan tekan Selesai Mengajar. Tanpa satu sesi yang jurnalnya tidak submitted, komponen "kelengkapan jurnal" akan selalu 100% dan kamu tidak pernah menguji rumusnya.

### 0d. Nilai post-test

Sebagai **tentor A**, ulangi 0b dengan:

```
Tipe Test : Post-Test
Judul     : "Post-Test Aljabar"
Tanggal   : hari ini
Nilai     : 60, 70, 82, 90
```

Perhatikan pasangannya terhadap 0b:

| Siswa | Pre | Post | Kenaikan mentah | Normalized Gain |
|---|---|---|---|---|
| 1 | 40 | 60 | +20 | (60−40)/(100−40) = 0,33 |
| 2 | 55 | 70 | +15 | (70−55)/(100−55) = 0,33 |
| 3 | 70 | 82 | +12 | (82−70)/(100−70) = 0,40 |
| 4 | 85 | 90 | +5 | (90−85)/(100−85) = 0,33 |

Siswa 1 dan 4 punya kenaikan mentah yang jauh berbeda (+20 vs +5) tapi gain yang sama. Pakai angka ini sebagai kasus uji: kalau dashboard menampilkan siswa 1 jauh lebih unggul dari siswa 4, rumusnya salah.

### 0e. Tentor kedua sebagai pembanding

Assign **tentor B** ke kelas lain, ulangi 0b–0d dengan angka berbeda, dan biarkan jurnalnya lebih lengkap atau lebih bolong dari tentor A. Dua tentor dengan profil berbeda membuat halaman perbandingan KPI benar-benar teruji.

### 0f. Kasus tepi yang wajib ada

Tambahkan dua kondisi ini lewat alur yang sama — keduanya pasti terjadi di pemakaian nyata:

- **Satu siswa hanya punya pre-test, tanpa post-test** (misal siswa baru). Input nilai pre-test untuk satu siswa tambahan, jangan beri post-test.
- **Satu siswa dengan pre-test 100.** Ini membuat penyebut `100 − pre` jadi nol. Wajib ada supaya pembagian-nol ketahuan sekarang.

### 0g. Verifikasi data siap

Sebelum menulis kode KPI, cek lewat UI bahwa datanya benar-benar ada:

```
[ ] Tentor → Nilai : nilai pre-test dan post-test tampil untuk tiap siswa
[ ] KG → Monitoring → Jurnal : ada jurnal submitted, dan ada sesi yang tidak
[ ] KG → Monitoring → Sesi : jumlah sesi sesuai yang kamu jalankan
[ ] Ada siswa tanpa post-test
[ ] Ada siswa dengan pre-test 100
```

---

## Langkah 1 — Migration: Konfigurasi & Snapshot KPI

```bash
supabase migration new create_kpi
```

```sql
create table kpi_config (
  id uuid primary key default gen_random_uuid(),
  bobot_gain integer not null default 60,
  bobot_jurnal integer not null default 40,
  periode text not null default 'bulanan' check (periode in ('bulanan', 'semesteran')),
  valid_from date not null,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (bobot_gain + bobot_jurnal = 100)
);

create table kpi_snapshot (
  id uuid primary key default gen_random_uuid(),
  tentor_id uuid not null references profiles(id),
  periode_mulai date not null,
  periode_selesai date not null,
  nilai_gain numeric(5,2),
  nilai_jurnal numeric(5,2),
  skor numeric(5,2) not null,
  jumlah_siswa_dinilai integer not null,
  jumlah_sesi integer not null,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tentor_id, periode_mulai, tahun_ajaran_id)
);

grant all privileges on table kpi_config, kpi_snapshot to anon, authenticated, service_role;
```

`valid_from` pada config, bukan mutasi di tempat: menghitung ulang periode lalu harus memakai bobot yang berlaku saat itu, bukan bobot hari ini.

`jumlah_siswa_dinilai` dan `jumlah_sesi` disimpan supaya dashboard bisa menampilkan penyebutnya. Skor 50% dari dua siswa terbaca jauh berbeda dari 50% dari dua puluh siswa.

## Langkah 2 — Rumus KPI

`src/features/kpi/data/hitung.ts`:

```
Normalized Gain per siswa = (post − pre) / (100 − pre)
Gain tentor               = rata-rata gain seluruh siswa yang punya pre DAN post
Kelengkapan jurnal        = sesi dengan jurnal submitted / seluruh sesi
Skor                      = (gain × bobot_gain + jurnal × bobot_jurnal) / 100
```

Tiga kasus tepi yang **wajib** ditangani — dua di antaranya sudah kamu siapkan datanya di Langkah 0f:

| Kasus | Perlakuan |
|---|---|
| `pre = 100` | Penyebut nol. Kecualikan siswa ini dari rata-rata, jangan hitung sebagai 0 — siswa yang sudah sempurna tidak bisa naik, dan menghitungnya sebagai nol menghukum tentor atas hasil terbaiknya |
| Siswa tanpa post-test | Kecualikan dari perhitungan gain, tapi catat jumlahnya |
| Tentor tanpa sesi sama sekali | `nilai_jurnal = null`, bukan 0. Tampilkan "belum ada data", bukan skor nol |
| `post < pre` | Gain negatif. **Biarkan negatif**, jangan dijepit ke nol — penurunan nilai adalah informasi yang nyata |

Sumber nilai: gabungkan `nilai_manual` (tipe `pre_test`/`post_test`) dan `attempt` dari `try_out` yang `tipe_test`-nya `pre_test`/`post_test`. Kalau satu siswa punya lebih dari satu, pakai yang tanggalnya paling awal untuk pre dan paling akhir untuk post.

## Langkah 3 — Ganti `kpi-contoh.ts`

Hapus `src/features/kpi/data/kpi-contoh.ts` dan ganti pemanggilnya dengan query sungguhan. Catatan di file itu sudah benar: ganti modulnya, jangan menambah kolom di sana.

Cari pemakaiannya dulu:

```powershell
Get-ChildItem src -Recurse -Include *.svelte,*.ts | Select-String -Pattern "kpi-contoh"
```

## Langkah 4 — Snapshot per Periode

`src/features/kpi/data/snapshot.ts`:

- `hitungSnapshot(tentorId, mulai, selesai)` — hitung dari data mentah
- `simpanSnapshot(...)` — upsert ke `kpi_snapshot`
- `ambilSnapshot(periode, tahunAjaranId)` — untuk dashboard

Snapshot dibuat saat KG membuka halaman KPI dan periode berjalan belum punya baris, atau lewat tombol "Hitung Ulang". Tidak perlu cron — skala 5 tentor tidak menuntutnya.

Periode lampau yang snapshot-nya sudah ada **jangan dihitung ulang otomatis**. Itulah gunanya snapshot: angka masa lalu tetap stabil meski bobot berubah.

## Langkah 5 — UI KG: Dashboard KPI

`src/routes/kepala-guru/kpi/+page.svelte`

- Tabel semua tentor: nama, gain, kelengkapan jurnal, skor
- **Tampilkan penyebutnya**, bukan cuma persentase: "67% (2 dari 3 sesi)". Angka telanjang mengundang perdebatan
- Skor dalam DM Mono, sesuai `design-system.md`
- Tentor dengan data belum cukup ditandai "belum ada data", bukan skor 0
- Pemilih periode + tombol Hitung Ulang

## Langkah 6 — UI KG: Konfigurasi Bobot

`src/routes/kepala-guru/kpi/konfigurasi/+page.svelte`

- Dua input bobot, validasi jumlahnya 100
- Pilihan periode: bulanan / semesteran
- Simpan membuat baris config **baru** dengan `valid_from` hari ini, bukan menimpa yang lama

## Langkah 7 — UI Tentor: KPI Saya

`src/routes/tentor/kpi/+page.svelte`

Tentor hanya melihat skornya sendiri, dengan rincian komponen dan penyebutnya. Jangan tampilkan tentor lain — KPI adalah alat evaluasi kepala guru, bukan papan peringkat.

## Langkah 8 — Dashboard Overview KG

Perluas `src/routes/kepala-guru/dashboard`:

| Widget | Sumber |
|---|---|
| Presensi tentor hari ini | `sesi_mengajar` tanggal hari ini vs jumlah tentor |
| Jurnal belum direview | `jurnal_mengajar` status `submitted` |
| Try out minggu ini | `try_out` dengan `waktu_buka` dalam 7 hari |
| Relief hari ini | `relief` aktif tanggal hari ini |
| Sesi selesai hari ini | `sesi_mengajar` status `closed` hari ini |

Semua memakai `hariIni()` dari `$lib/utils/tanggal`, bukan tanggal server.

## Langkah 9 — Rekap Tahun Ajaran

Pemilih tahun ajaran di header dashboard KG. Memilih tahun lain mengganti `tahun_ajaran_id` pada seluruh query halaman monitoring, nilai, dan KPI.

Tahun tidak aktif bersifat **baca saja** — tidak ada tombol tambah, ubah, atau hapus. Tandai jelas di UI bahwa yang sedang dilihat adalah arsip.

## Langkah 10 — Export Laporan Siswa

Mulai dengan yang paling sederhana: **halaman laporan + print stylesheet**, tanpa library PDF.

`src/routes/kepala-guru/laporan/[siswaId]/+page.svelte` — satu halaman berisi identitas siswa, seluruh nilai, presensi, dan grafik progress, dengan `@media print` yang merapikannya. KG menekan Ctrl+P dan menyimpan sebagai PDF.

Nol dependensi, dan hasilnya sudah memenuhi kebutuhan "bisa dibagikan ke wali".

Export massal (ZIP berisi satu PDF per siswa) **ditunda**. Itu menuntut library PDF dan library ZIP untuk sesuatu yang bisa dikerjakan KG satu per satu di skala 50 siswa. Bangun kalau sudah terbukti memakan waktu, bukan sebelumnya.

## Langkah 11 — Testing

Ikuti `docs/fase-5-testing-guide.md`.

---

## Urutan Prioritas Jika Terbatas Waktu

1. Langkah 0 — data. Tanpa ini semua langkah lain tidak bisa diverifikasi
2. Langkah 1–3 — migration, rumus, ganti data contoh. Ini inti Fase 5
3. Langkah 5 — dashboard KPI KG
4. Langkah 8 — overview. Cepat, membaca data yang sudah ada
5. Langkah 6–7 — konfigurasi bobot dan KPI tentor
6. Langkah 9 — rekap tahun ajaran
7. Langkah 10 — laporan cetak
