# Relief Person — Testing Guide

Validasi pengajuan relief, otorisasi pengganti, dan notifikasi email.

Prasyarat: `cd pena_web ; npm run dev` → http://localhost:5173

---

## Akun & Data Uji

| Peran | Email | Catatan |
|---|---|---|
| Kepala Guru | `kg@test.com` | Penerima kedua semua email relief |
| Tentor A | `gondol@test.com` | Mengajar Kelas 5A + Matematika. Yang berhalangan |
| Tentor B | `tentor_lain@test.com` | Pengganti. **Tidak** mengajar Kelas 5A |
| Tentor C | `tentor_c@test.com` | Tidak terlibat — untuk uji otorisasi |
| Siswa | beberapa | Terdaftar di Kelas 5A |

SMTP harus sudah dikonfigurasi (Langkah 2 di execution guide) sebelum Bagian 3.

---

## Bagian 1 — Pengajuan Relief

Path: **Tentor → Relief**

| # | Langkah | Hasil yang benar |
|---|---|---|
| 1.1 | Buka dropdown kelas + mapel | Hanya kombinasi yang Tentor A ajar |
| 1.2 | Buka dropdown pengganti | Semua tentor aktif kecuali Tentor A sendiri |
| 1.3 | Isi lengkap, tanggal besok, submit | Tersimpan, muncul di daftar dengan status Aktif |
| 1.4 | Pilih tanggal kemarin | Ditolak: *"Tanggal tidak boleh di masa lalu"* |
| 1.5 | Kosongkan task | Ditolak: *"Task delegasi wajib diisi"* |
| 1.6 | Ajukan relief kedua untuk kelas, mapel, dan tanggal yang sama | Ditolak — unique index |
| 1.7 | Ajukan untuk kelas yang tidak diajar Tentor A (lewat API langsung) | `403 Anda tidak mengajar kelas ini` |
| 1.8 | Tunjuk diri sendiri sebagai pengganti (lewat API langsung) | Ditolak — check constraint |

---

## Bagian 2 — Otorisasi Pengganti

Bagian paling penting. Tanpa ini fitur relief tidak berguna.

| # | Langkah | Hasil yang benar |
|---|---|---|
| 2.1 | Login Tentor B **sebelum** tanggal relief, buka presensi diri | Kelas 5A **tidak** muncul di dropdown |
| 2.2 | Pada tanggal relief, buka presensi diri | Kelas 5A muncul dengan penanda **(relief)** |
| 2.3 | Buka sesi untuk Kelas 5A | Berhasil — sesi tercatat atas nama Tentor B |
| 2.4 | Isi presensi murid | Daftar siswa Kelas 5A muncul; lolos tanpa perlakuan khusus karena Tentor B pemilik sesi |
| 2.5 | Isi jurnal dan Selesai Mengajar | Berjalan normal, sama seperti sesi biasa |
| 2.6 | **Hari berikutnya**, buka presensi diri lagi | Kelas 5A **hilang** dari dropdown — izin habis sendiri tanpa pencabutan manual |
| 2.7 | Login Tentor C, buka presensi diri pada tanggal relief | Kelas 5A tidak muncul — relief hanya untuk pengganti yang ditunjuk |
| 2.8 | Tentor C panggil `/api/sesi` untuk Kelas 5A lewat curl | `403 Anda tidak mengajar kelas ini` |

### 2b. Jalur otorisasi asli tidak rusak

Langkah 6 di execution guide mengubah kode Fase 3. Pastikan tidak ada yang patah:

| # | Langkah | Hasil yang benar |
|---|---|---|
| 2.9 | Tentor A buka sesi untuk kelas yang memang dia ajar | Tetap berhasil seperti sebelumnya |
| 2.10 | Tentor A buka sesi untuk kelas yang tidak dia ajar | Tetap ditolak `403` |

---

## Bagian 3 — Email

| # | Langkah | Hasil yang benar |
|---|---|---|
| 3.1 | Ajukan relief | Dua email terkirim: ke Tentor B dan ke KG |
| 3.2 | Periksa isi email | Nama Tentor A, kelas, mapel, tanggal, task delegasi, tautan ke dashboard |
| 3.3 | Batalkan relief | Dua email susulan terkirim ke penerima yang sama |
| 3.4 | Matikan SMTP (rusak `SMTP_HOST` sementara), ajukan relief | **Relief tetap tersimpan.** Endpoint balas 200. `email_error` terisi. UI menampilkan peringatan agar tentor mengabari manual |
| 3.5 | Setelah 3.4, cek otorisasi Tentor B | Tetap berwenang membuka sesi — kegagalan email tidak memblokir apa pun |

Poin 3.4 dan 3.5 sengaja diuji: fitur ini paling dibutuhkan justru saat keadaan sedang tidak ideal. Menggagalkan pengajuan karena mail server mati akan membuatnya tidak bisa diandalkan.

---

## Bagian 4 — Pembatalan

| # | Langkah | Hasil yang benar |
|---|---|---|
| 4.1 | Batalkan relief yang belum dipakai | Status jadi **Dibatalkan** |
| 4.2 | Setelah dibatalkan, Tentor B cek presensi diri | Kelas 5A hilang dari dropdown |
| 4.3 | Tentor B sudah membuka sesi, lalu Tentor A coba batalkan | Ditolak: *"Sesi sudah dibuka, relief tidak bisa dibatalkan"* |
| 4.4 | Tentor C coba batalkan relief milik Tentor A | `403 Bukan relief Anda` |

---

## Bagian 5 — Modul untuk Pengganti

| # | Langkah | Hasil yang benar |
|---|---|---|
| 5.1 | Tentor B buka **Modul** pada tanggal relief | Mapel Matematika muncul, meski Tentor B tidak mengajarnya |
| 5.2 | Buka modulnya | Hanya yang berstatus `published` |
| 5.3 | Hari berikutnya buka Modul lagi | Matematika hilang dari daftar |
| 5.4 | Cek halaman presensi diri kelas relief | Task delegasi dari Tentor A tampil menonjol |

---

## Bagian 6 — Monitoring KG

Path: **Kepala Guru → Monitoring → Relief**

| # | Langkah | Hasil yang benar |
|---|---|---|
| 6.1 | Buka halaman | Tabel berisi tanggal, tentor asli, pengganti, kelas, mapel, task, status |
| 6.2 | Filter per tanggal dan tentor | Hasil terfilter benar |
| 6.3 | Cek baris dengan `email_error` | Diberi penanda agar KG tahu ada yang perlu dikabari manual |
| 6.4 | Login tentor, buka `/kepala-guru/monitoring/relief` | Redirect ke `/login` |

---

## Bagian 7 — KPI Tidak Terpengaruh

| # | Langkah | Hasil yang benar |
|---|---|---|
| 7.1 | Setelah sesi relief selesai, cek data KPI Tentor A | Tidak ada penalti — sesi itu bukan miliknya |
| 7.2 | Cek data KPI Tentor B | Sesi relief tercatat atas namanya apa adanya. Tidak ada penyesuaian khusus |

Ini perilaku yang disengaja. Jangan menambahkan logika kompensasi.

---

## Bagian 8 — Uji Otorisasi via curl

```bash
login() {
  curl -s -c "$1.txt" -X POST http://localhost:5173/auth/login \
    -H "x-sveltekit-action: true" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "email=$2" --data-urlencode "password=TestPass123" > /dev/null
}
login tentorA gondol@test.com
login tentorB tentor_lain@test.com
login tentorC tentor_c@test.com
login siswa siswa_coba@test.com
```

| # | Perintah | Harus gagal dengan |
|---|---|---|
| 8.1 | Siswa POST `/api/relief` | `403 Tidak diizinkan` |
| 8.2 | Tentor C batalkan relief milik Tentor A | `403 Bukan relief Anda` |
| 8.3 | Tentor C buka sesi Kelas 5A pada tanggal relief | `403` |
| 8.4 | Tentor B buka sesi Kelas 5A **sehari setelah** tanggal relief | `403` |
| 8.5 | Ajukan relief dengan `pengganti_id` = `tentor_asli_id` | Ditolak check constraint |

---

## Ringkasan Cakupan

| Item | Bagian |
|---|---|
| Pengajuan + validasi | 1.1–1.8 |
| Pengganti bisa buka sesi | 2.2–2.5 |
| Izin habis sendiri lewat tanggal | 2.6, 8.4 |
| Jalur otorisasi asli tidak rusak | 2.9–2.10 |
| Email ke dua penerima | 3.1–3.3 |
| Email gagal tidak memblokir | 3.4–3.5 |
| Pembatalan dan batasnya | 4.1–4.4 |
| Modul untuk pengganti | 5.1–5.3 |
| KPI tidak terpengaruh | 7.1–7.2 |

---

## Catatan Untuk Nanti

- **Tidak ada jadwal**, jadi pengganti melihat seluruh modul mapel itu, bukan materi hari itu. Kalau nanti ada tabel jadwal, inilah tempat pertama yang layak diperbaiki.
- **Relief tidak mencakup siswa privat** — mereka tidak punya kelas. Koordinasinya di luar sistem.
- **Satu relief = satu kelas + satu mapel + satu tanggal.** Tentor yang berhalangan sehari penuh dengan tiga kelas mengajukan tiga kali. Kalau ini sering terjadi, pertimbangkan pengajuan massal — tapi jangan bangun sebelum terbukti perlu.
