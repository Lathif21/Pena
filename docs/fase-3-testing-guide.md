# Fase 3 — Testing Guide

Validasi end-to-end untuk sesi mengajar: presensi tentor, presensi murid, jurnal, dan Selesai Mengajar.
Semua lewat UI browser kecuali disebutkan lain.

Prasyarat: `cd pena_web ; npm run dev` → http://localhost:5173

---

## Akun & Data Uji

| Peran | Email | Catatan |
|---|---|---|
| Kepala Guru | `kg@test.com` | |
| Tentor A | `gondol@test.com` | Diassign ke Kelas 5A + Matematika |
| Tentor B | `tentor_lain@test.com` | Diassign ke kelas **berbeda** — untuk uji otorisasi |
| Siswa Reguler | `siswa_coba@test.com` | Terdaftar di Kelas 5A |
| Siswa Privat | `siswa_privat@test.com` | Paket privat, tanpa kelas |

Siapkan juga: 1 materi di bawah mapel Matematika (untuk dropdown jurnal), dan foto uji dari aplikasi Timestamp Camera Free (atau gambar apa pun untuk uji fungsional).

---

## Bagian 1 — Presensi Tentor

Path: **Tentor → Presensi Diri**

| # | Langkah | Hasil yang benar |
|---|---|---|
| 1.1 | Buka dropdown kelas | Hanya kelas yang tentor ini ajar — bukan semua kelas |
| 1.2 | Pilih kelas, buka dropdown mapel | Hanya mapel yang terhubung ke kelas itu lewat `mapel_kelas` **dan** diajar tentor ini |
| 1.3 | Upload foto, submit | Sesi terbuka, foto tampil, `uploaded_at` tercatat |
| 1.4 | Cek database `sesi_mengajar` | Status `open`, `started_at` dan `uploaded_at` terisi |
| 1.5 | Upload foto lagi selagi sesi `open` | Foto lama tergantikan |
| 1.6 | Upload file non-gambar (.pdf) | Ditolak di level storage policy |
| 1.7 | Upload gambar > 5MB | Ditolak |

---

## Bagian 2 — Presensi Murid

Path: **Tentor → Presensi Murid**

| # | Langkah | Hasil yang benar |
|---|---|---|
| 2.1 | Buka halaman **sebelum** presensi diri | Pesan "Submit presensi diri dulu" + link; tabel siswa tidak muncul |
| 2.2 | Setelah presensi diri, buka lagi | Daftar siswa Kelas 5A muncul, checkbox default tercentang |
| 2.3 | Cek daftar siswa | **Siswa privat tidak muncul** sama sekali |
| 2.4 | Hilangkan centang 1 siswa, simpan | Tersimpan; cek `presensi_murid` — satu baris per siswa, `is_hadir` sesuai |
| 2.5 | Ubah lagi selagi sesi `open` | Boleh — presensi masih bisa dikoreksi |
| 2.6 | Simpan presensi setelah sesi `closed` | Ditolak: *"Sesi sudah ditutup"* |

---

## Bagian 3 — Jurnal Mengajar

Path: **Tentor → Jurnal**

| # | Langkah | Hasil yang benar |
|---|---|---|
| 3.1 | Buka dropdown materi | Hanya materi dari mapel sesi aktif |
| 3.2 | Isi deskripsi, simpan | Status **Draft** |
| 3.3 | Edit dan simpan lagi | Tetap draft, isi terbarui |
| 3.4 | Kosongkan deskripsi, simpan | Ditolak: *"Deskripsi wajib diisi"* |
| 3.5 | Coba buat jurnal kedua untuk sesi yang sama | Ditolak — unique constraint di `sesi_id` |

---

## Bagian 4 — Selesai Mengajar

| # | Langkah | Hasil yang benar |
|---|---|---|
| 4.1 | Klik Selesai Mengajar **sebelum** jurnal diisi | Tombol disabled; kalau API dipanggil langsung → ditolak *"Jurnal mengajar belum diisi"* |
| 4.2 | Isi jurnal, klik Selesai Mengajar | Muncul confirmation popup |
| 4.3 | Batalkan di popup | Tidak terjadi apa-apa, sesi tetap `open` |
| 4.4 | Konfirmasi | Sesi `closed`, `ended_at` terisi, jurnal jadi `submitted` dengan `submitted_at` |
| 4.5 | Cek ketiganya di database | Ketiga efek terjadi bersamaan — tidak ada yang setengah jalan |
| 4.6 | Coba edit presensi/jurnal setelah closed | Ditolak |
| 4.7 | Klik Selesai Mengajar dua kali | Yang kedua ditolak: sesi sudah `closed` |

### 4b. Atomisitas RPC

| # | Langkah | Hasil yang benar |
|---|---|---|
| 4.8 | Di SQL Editor, panggil `select close_sesi('<sesi_id_tanpa_jurnal>')` | Exception *"Jurnal mengajar belum diisi"*; `sesi_mengajar` **tidak** berubah status |
| 4.9 | Cek setelah 4.8 | Tidak ada sesi yang `closed` tapi jurnalnya masih `draft` |

---

## Bagian 5 — Multi Sesi Sehari

| # | Langkah | Hasil yang benar |
|---|---|---|
| 5.1 | Tentor A buka sesi Kelas 5A, selesaikan penuh | Sesi 1 `closed` |
| 5.2 | Buka sesi lagi untuk kelas berbeda di hari yang sama | Sesi 2 terbuka, terpisah dari sesi 1 |
| 5.3 | Cek `sesi_mengajar` | Dua baris berbeda, masing-masing punya presensi murid dan jurnal sendiri |

---

## Bagian 6 — Monitoring KG

Path: **Kepala Guru → Monitoring**

| # | Langkah | Hasil yang benar |
|---|---|---|
| 6.1 | Monitoring → Presensi | Tabel berisi tentor, kelas, mapel, thumbnail foto, `uploaded_at` |
| 6.2 | Klik thumbnail | Foto tampil besar; timestamp dan lokasi terbakar di gambar terbaca |
| 6.3 | Bandingkan dua timestamp | Waktu di foto dan `uploaded_at` sistem **keduanya** tampil — bukan salah satu |
| 6.4 | Filter per tanggal dan tentor | Hasil terfilter benar |
| 6.5 | Monitoring → Jurnal | Hanya jurnal `submitted` yang muncul; tidak ada tombol approve/reject |
| 6.6 | Monitoring → Sesi | Ringkasan per sesi: foto, jumlah hadir, jurnal, nilai hari itu |

---

## Bagian 7 — Uji Otorisasi (wajib, tidak bisa lewat UI)

Tidak ada RLS di proyek ini — semua otorisasi ada di endpoint `/api/*`. Bagian ini yang membuktikannya.

Login dan simpan cookie:

```bash
login() {
  curl -s -c "$1.txt" -X POST http://localhost:5173/auth/login \
    -H "x-sveltekit-action: true" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "email=$2" --data-urlencode "password=TestPass123" > /dev/null
}
login tentorA gondol@test.com
login tentorB tentor_lain@test.com
login siswa siswa_coba@test.com
```

| # | Perintah | Harus gagal dengan |
|---|---|---|
| 7.1 | Tentor B buka sesi untuk kelas yang diajar Tentor A | `403 Anda tidak mengajar kelas ini` |
| 7.2 | Tentor B simpan presensi murid untuk sesi milik Tentor A | `403 Bukan sesi Anda` |
| 7.3 | Tentor B simpan jurnal untuk sesi milik Tentor A | `403 Bukan sesi Anda` |
| 7.4 | Tentor B panggil `/api/sesi/<sesi_A>/close` | `403 Bukan sesi Anda` |
| 7.5 | Siswa panggil `/api/sesi` (POST) | `403 Tidak diizinkan` |
| 7.6 | Siswa akses `/kepala-guru/monitoring/presensi` | Redirect ke `/login` |
| 7.7 | Tentor akses `/kepala-guru/monitoring/jurnal` | Redirect ke `/login` |
| 7.8 | Simpan presensi murid untuk sesi yang sudah `closed` | `409 Sesi sudah ditutup` |

**7.9 — Foto presensi tidak bisa diakses tanpa login.** Ambil `foto_path` dari database, susun URL publik bucket, buka di browser mode incognito. Harus **403 / Not Found** — bukan foto tampil. Kalau fotonya muncul, bucket salah setel jadi public.

**7.10 — KG bisa lihat foto semua tentor, tentor hanya miliknya.** Login sebagai Tentor B, coba ambil signed URL foto milik Tentor A lewat endpoint → `403`.

---

## Ringkasan Cakupan

| Item checklist Langkah 18 | Bagian |
|---|---|
| Upload foto presensi, sesi terbuka | 1.3–1.4 |
| Presensi murid diblokir sebelum presensi diri | 2.1 |
| Siswa privat tidak muncul di checklist | 2.3 |
| Jurnal tersimpan sebagai draft | 3.2 |
| Selesai Mengajar diblokir tanpa jurnal | 4.1 |
| Tiga efek Selesai Mengajar atomik | 4.4–4.5, 4.8–4.9 |
| Tidak bisa edit setelah closed | 2.6, 4.6 |
| Dua kelas sehari = dua sesi | 5.1–5.3 |
| KG lihat kedua timestamp | 6.3 |
| Jurnal tanpa approve/reject | 6.5 |
| Otorisasi kepemilikan sesi | 7.1–7.4 |

---

## Catatan Untuk Fase Berikutnya

- **Relief person belum ada.** Kalau tentor berhalangan, koordinasi masih manual di luar sistem sampai Fase 4.
- **Tidak ada reopen sesi.** Sesi yang salah ditutup harus diperbaiki KG langsung di database. Kalau ini sering terjadi, pertimbangkan fitur reopen di fase berikutnya.
- **Presensi murid tidak punya status izin/sakit** — hanya hadir atau tidak. Kalau bimbel butuh pembedaan, itu penambahan kolom di Fase 4+.
