---
paths:
  - "**/features/kpi/**"
  - "**/routes/kepala-guru/kpi/**"
  - "**/routes/tentor/kpi/**"
  - "**/routes/kepala-guru/dashboard/**"
  - "**/routes/kepala-guru/laporan/**"
  - "**/routes/api/kpi/**"
  - "supabase/migrations/**"
---

# KPI Tentor

Dihitung otomatis dari data objektif. Kepala guru mengatur bobot, sistem melakukan aritmetikanya.

## Dua Komponen

| Komponen | Sumber | Bobot default |
|---|---|---|
| Progress nilai siswa | Normalized Gain dari pre-test dan post-test | 60 |
| Kelengkapan jurnal | Sesi dengan jurnal `submitted` dibagi seluruh sesi | 40 |

Presensi tentor **tidak** masuk KPI. Latihan soal juga tidak — hanya nilai bertipe `pre_test` dan `post_test`, baik dari `nilai_manual` maupun dari `try_out` yang ditandai demikian.

## Normalized Gain

```
gain siswa  = (post − pre) / (100 − pre)
gain tentor = rata-rata gain seluruh siswa yang punya pre DAN post
```

Kenaikan mentah tidak dipakai karena tidak adil: menaikkan siswa dari 85 ke 92 jauh lebih sulit daripada 40 ke 60, tapi selisih mentahnya membuat yang kedua terlihat tiga kali lebih baik. Normalized Gain mengukur berapa persen dari ruang perbaikan yang tersisa berhasil ditutup, sehingga otomatis mengompensasi nilai awal yang tinggi.

## Kasus Tepi

Semuanya akan muncul di pemakaian nyata. Tangani sejak awal.

| Kasus | Perlakuan | Alasan |
|---|---|---|
| `pre = 100` | Kecualikan siswa dari rata-rata | Penyebut nol. Menghitungnya sebagai 0 akan menghukum tentor atas hasil terbaiknya |
| Tanpa post-test | Kecualikan dari gain, catat jumlahnya | Siswa baru atau belum sempat ujian |
| Tanpa pre-test | Kecualikan dari gain | Tidak ada titik awal untuk diukur |
| `post < pre` | Biarkan negatif | Penurunan nilai adalah informasi nyata, bukan kesalahan data |
| Tentor tanpa sesi | `nilai_jurnal = null`, bukan 0 | Tampilkan "belum ada data". Skor nol menyiratkan kegagalan, padahal belum ada yang diukur |
| Lebih dari satu pre/post | Pre = tanggal paling awal, post = paling akhir | |

## Menampilkan Skor

**Selalu tampilkan penyebutnya.** "67%" saja mengundang perdebatan; "67% (2 dari 3 sesi)" tidak. Karena itu `kpi_snapshot` menyimpan `jumlah_siswa_dinilai` dan `jumlah_sesi` — keduanya untuk ditampilkan, bukan sekadar arsip.

Selalu tampilkan rincian komponen, jangan skor telanjang. Angka tunggal tanpa penjelasan akan dipertanyakan, dan kepala guru tidak punya jawabannya.

Angka memakai DM Mono sesuai `design-system.md`.

## Siapa Melihat Apa

- **Tentor** hanya melihat skornya sendiri beserta rinciannya
- **Kepala guru** melihat seluruh tentor

Tidak ada papan peringkat antar-tentor yang terlihat oleh tentor. KPI adalah alat evaluasi kepala guru, dan memajang peringkat mengubah alat evaluasi jadi tekanan sosial.

## Konfigurasi

`kpi_config` memakai `valid_from`, bukan mutasi di tempat. Menghitung ulang periode lampau harus memakai bobot yang berlaku saat itu, bukan bobot hari ini — kalau tidak, skor masa lalu berubah setiap kali kepala guru menyesuaikan bobot.

Bobot wajib berjumlah 100, dijaga oleh check constraint di database.

## Snapshot

Skor disimpan per periode di `kpi_snapshot`, tidak dihitung ulang setiap kali halaman dibuka. Snapshot membuat riwayat murah dan menjaga skor lampau tetap stabil meski konfigurasi berubah.

Periode berjalan boleh dihitung ulang. **Periode yang sudah lewat jangan dihitung ulang otomatis** — itulah gunanya snapshot.

Pembuatan snapshot dipicu saat kepala guru membuka halaman KPI atau menekan Hitung Ulang. Tidak perlu scheduled job pada skala lima tentor.

## Waktu

Semua batas periode dan perbandingan "hari ini" memakai `hariIni()` dari `$lib/utils/tanggal` (Asia/Jakarta), bukan tanggal server maupun `current_date` Postgres. Server UTC menggeser pergantian hari ke pukul 07:00 WIB.
