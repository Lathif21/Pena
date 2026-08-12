# Fase 2 — Testing Guide

Validasi end-to-end untuk soal, latihan, try out, auto-grading, dan nilai manual.
Semua langkah lewat UI browser kecuali disebutkan lain.

Prasyarat: `cd pena_web && npm run dev` → http://localhost:5173

---

## Akun Uji

Buat lewat **Akun** di dashboard KG kalau belum ada. Password semua: `TestPass123`.

| Peran | Email | Catatan |
|---|---|---|
| Kepala Guru | `kg@test.com` | Sudah ada |
| Tentor | `gondol@test.com` | |
| Siswa A | `siswa_coba@test.com` | Harus terdaftar di kelas target try out |
| Siswa B | `siswa_lain@test.com` | Kelas **berbeda** — untuk uji targeting |

Siapkan juga: 1 mapel, minimal 1 kelas terhubung ke mapel itu (Master Data → Mata Pelajaran → centang kelas), 1 materi, 1 sub materi.

> Siswa yang tidak punya kelas tidak melihat mapel apa pun. Kalau daftar mapel siswa kosong, cek `siswa_kelas` dan relasi `mapel_kelas` dulu.

---

## Bagian 1 — Builder Soal (KG)

Path: **Konten → [mapel] → [materi] → [sub materi] → Soal** (latihan), atau **→ Try Out** (try out).

| # | Langkah | Hasil yang benar |
|---|---|---|
| 1.1 | Buat soal dengan 3 pilihan, 1 benar | Tersimpan |
| 1.2 | Buat soal dengan 4 dan 5 pilihan | Tersimpan — jumlah pilihan bebas per soal |
| 1.3 | Simpan soal tanpa menandai jawaban benar | Ditolak: *"Harus tepat 1 jawaban benar"* |
| 1.4 | Tandai 2 jawaban benar | Ditolak: *"Harus tepat 1 jawaban benar"* |
| 1.5 | Simpan soal dengan 1 pilihan saja | Ditolak: *"Minimal 2 pilihan jawaban"* |
| 1.6 | Kosongkan teks salah satu pilihan | Ditolak: *"Semua pilihan harus diisi"* |

---

## Bagian 2 — Penjadwalan Try Out (KG)

Path: **Konten → [mapel] → [materi] → Kelola Try Out**

| # | Langkah | Hasil yang benar |
|---|---|---|
| 2.1 | Isi judul, tipe **Biasa**, waktu buka, durasi, centang minimal 1 kelas | Tombol **Buat Try Out** aktif dan tersimpan |
| 2.2 | Jangan centang kelas apa pun | Tombol tetap **disabled** — try out tanpa kelas tidak bisa dikerjakan siapa pun |
| 2.3 | Buat try out tipe **Pre-Test** | Tersimpan |
| 2.4 | Buat pre-test **kedua** di mapel yang sama (materi mana pun) | Ditolak: *"Sudah ada pre-test untuk mapel ini"* |
| 2.5 | Publish try out yang belum punya soal | Ditolak: *"Try out harus memiliki minimal 1 soal"* |
| 2.6 | Publish try out yang sudah ada soal + kelas | Status jadi **Published** |

> Daftar kelas di form hanya berisi kelas yang terhubung ke mapel ini lewat `mapel_kelas` — bukan semua kelas.

### 2b. Edit Try Out

Judul, tipe test, waktu buka, durasi, dan target kelas bisa diubah lewat tombol **Edit Jadwal** di panel detail — selama try out masih **Draft**.

| # | Langkah | Hasil yang benar |
|---|---|---|
| 2.7 | Pilih try out draft → **Edit Jadwal** | Form terisi nilai yang sekarang, termasuk centang kelas dan waktu buka |
| 2.8 | Ubah judul, waktu, durasi, dan centang kelas lain → **Simpan Perubahan** | Semua tersimpan; panel detail langsung memperlihatkan nilai baru |
| 2.9 | Kosongkan judul | Ditolak: *"Judul wajib diisi"* |
| 2.10 | Durasi `0` | Ditolak: *"Durasi minimal 1 menit"* |
| 2.11 | Hilangkan semua centang kelas | Tombol simpan **disabled**; lewat API ditolak *"Pilih minimal satu kelas"* |
| 2.12 | Ubah tipe jadi **Pre-Test** padahal mapel sudah punya pre-test lain | Ditolak: *"Sudah ada pre-test untuk mapel ini"* |
| 2.13 | Publish, lalu coba **Edit Jadwal** | Tombol hilang; lewat API ditolak *"Batalkan publish try out dulu sebelum mengubah jadwal"* |
| 2.14 | Setelah jendela waktu lewat | Ditolak permanen: *"Try out sudah selesai — tidak bisa diubah lagi"* |

> Cek juga: waktu buka yang tampil di form harus sama dengan yang tersimpan (bukan geser beberapa jam). `datetime-local` memakai waktu lokal, database memakai UTC — konversinya ada di `TryOutForm`.

### 2c. Hapus Try Out

Tombol **Hapus** ada di panel detail try out yang berstatus Draft.

| # | Langkah | Hasil yang benar |
|---|---|---|
| 2.15 | Hapus try out draft yang belum pernah dikerjakan | Terhapus; soal di dalamnya ikut terhapus; pilihan pindah ke try out lain yang tersisa |
| 2.16 | Cek database | `deleted_at` terisi — baris tidak benar-benar dihapus (soft delete) |
| 2.17 | Hapus try out yang masih **published** | Ditolak: *"Batalkan publish try out dulu sebelum menghapus"* |
| 2.18 | Hapus try out yang jendelanya sudah lewat | Ditolak: *"Try out sudah selesai — tidak bisa dihapus"* |
| 2.19 | Batalkan publish try out yang sudah dikerjakan siswa, lalu hapus | Ditolak: *"Sudah ada siswa yang mengerjakan — try out tidak bisa dihapus"* |
| 2.20 | Login tentor/siswa, panggil endpoint hapus langsung | **403** |

### 2d. Revisi Soal Setelah Publish

Aturannya: **selama try out masih dipublish, soal terkunci.** Untuk memperbaiki soal, batalkan publish dulu. Setelah jendela waktu lewat, semuanya terkunci permanen.

| # | Langkah | Hasil yang benar |
|---|---|---|
| 2.7 | Try out **published**, jendela belum lewat — coba tambah/edit/hapus soal | Ditolak: *"Batalkan publish try out dulu sebelum mengubah soal"*; tombol Tambah/Edit/Hapus tidak muncul |
| 2.8 | Klik **Batalkan Publish** | Status kembali **Draft**, try out hilang dari halaman siswa |
| 2.9 | Tambah dan edit soal | Sekarang boleh |
| 2.10 | Publish lagi | Kembali **Published**, soal terkunci lagi |
| 2.11 | Tunggu sampai jendela waktu lewat (atau mundurkan `waktu_buka` di DB) | Tombol **Batalkan Publish** hilang, diganti *"Terkunci — waktu sudah lewat"* |
| 2.12 | Coba unpublish setelah lewat | Ditolak: *"Waktu try out sudah lewat — tidak bisa dibatalkan lagi"* |
| 2.13 | Coba tambah/edit/hapus soal setelah lewat | Ditolak: *"Try out sudah selesai — soal tidak bisa diubah lagi"* |

> Latihan (soal di sub materi) tidak pernah terkunci — boleh diubah kapan saja.

---

## Bagian 3 — Latihan (Siswa)

Path: **Mapel → [mapel] → [materi] → [sub materi] → Latihan**

| # | Langkah | Hasil yang benar |
|---|---|---|
| 3.1 | Kerjakan latihan sampai submit | Nilai langsung muncul |
| 3.2 | Klik **Ulangi**, kerjakan lagi | Boleh — latihan tidak dibatasi jumlah percobaan |
| 3.3 | Ulangi 3× | Ketiganya tersimpan sebagai attempt terpisah |
| 3.4 | Pilih jawaban satu per satu | Counter *"x dari y terjawab"* ikut naik tiap klik |

> Latihan tidak pernah masuk KPI dan tidak muncul di grafik wali. Itu memang disengaja.

---

## Bagian 4 — Try Out (Siswa) — bagian paling penting

Path: **Mapel → [mapel] → [materi] → [try out]**

### 4a. Jendela waktu

| # | Langkah | Hasil yang benar |
|---|---|---|
| 4.1 | Buka try out yang `waktu_buka`-nya masih di masa depan | Halaman error **403 "Try out belum dibuka"** |
| 4.2 | **Cek Network tab** di 4.1 | Payload **tidak** berisi soal sama sekali — bukan disembunyikan pakai CSS |
| 4.3 | Buka try out yang jendelanya sudah lewat | **403 "Try out sudah ditutup"** |
| 4.4 | Buka try out yang sedang berjalan | Halaman intro + tombol **Mulai Try Out** |

### 4b. Pengerjaan

| # | Langkah | Hasil yang benar |
|---|---|---|
| 4.5 | Mulai, jawab beberapa soal | Tiap pilihan langsung tersimpan (auto-save), counter naik |
| 4.6 | **Refresh browser** di tengah pengerjaan | Attempt yang sama dilanjutkan — bukan attempt baru, jawaban sebelumnya masih ada |
| 4.7 | Submit | Nilai muncul + **Review Jawaban** di bawahnya |
| 4.8 | Cek review | Tiap soal diberi label Benar / Salah / Tidak dijawab, jawaban benar ditandai hijau, jawaban siswa yang salah ditandai merah |
| 4.9 | Buka lagi try out yang sama | Ditolak: *"Sudah pernah mengerjakan try out ini"* |

### 4c. Skor

| # | Langkah | Hasil yang benar |
|---|---|---|
| 4.10 | Benar 2 dari 3 soal | Nilai **67** — dibulatkan ke atas, bukan 66 |
| 4.11 | Benar 0 soal | Nilai **0** |
| 4.12 | Benar semua | Nilai **100** |

### 4d. Abandonment

| # | Langkah | Hasil yang benar |
|---|---|---|
| 4.13 | Mulai try out berdurasi pendek (mis. 2 menit), jawab 1 soal, **tutup browser** | — |
| 4.14 | Tunggu sampai lewat durasi, buka lagi halaman try out | Attempt sudah **auto-submit** dan dinilai dari jawaban yang sempat tersimpan |
| 4.15 | Siswa yang **tidak pernah** mengerjakan sampai jendela tutup | Nilainya **0**, bukan kosong |

### 4e. Targeting

| # | Langkah | Hasil yang benar |
|---|---|---|
| 4.16 | Login sebagai **Siswa B** (kelas berbeda), buka try out itu | Ditolak: *"Try out ini bukan untuk kelas Anda"* |

---

## Bagian 5 — Nilai Manual (Tentor)

Path: **Tentor → Nilai → Input Nilai**

| # | Langkah | Hasil yang benar |
|---|---|---|
| 5.1 | Pilih mapel, tipe test, judul, tanggal; isi nilai untuk siswa yang diajar | Tersimpan |
| 5.2 | Isi nilai `150` | Ditolak: *"Nilai harus bilangan bulat 0-100"* |
| 5.3 | Cek daftar siswa di dropdown | Hanya siswa yang tentor ini ajar (lewat `tentor_kelas_mapel` atau `tentor_siswa_privat`) |
| 5.4 | **Tentor → Nilai** | Nilai e-learning dan nilai manual tampil berdampingan |

---

## Bagian 6 — Reset Attempt (KG)

Path: **Kepala Guru → Monitoring → Attempt**

| # | Langkah | Hasil yang benar |
|---|---|---|
| 6.1 | Reset attempt seorang siswa | Muncul attempt baru; siswa bisa mengerjakan ulang |
| 6.2 | Cek riwayat | Attempt lama masih ada dengan `is_active = false` — tidak dihapus |
| 6.3 | Reset attempt yang sama dua kali | Ditolak: *"Attempt ini sudah di-reset sebelumnya"* |
| 6.4 | Login **tentor**, coba akses menu reset | Tidak tersedia; kalau endpoint dipanggil langsung → **403** |

---

## Bagian 7 — Uji Keamanan (wajib, tidak bisa lewat UI)

Fase 2 tidak punya RLS, jadi otorisasi sepenuhnya ada di endpoint server. Ini yang membuktikannya. Jalankan di terminal saat dev server hidup.

Login dulu dan simpan cookie:

```bash
login() {
  curl -s -c "$1.txt" -X POST http://localhost:5173/auth/login \
    -H "x-sveltekit-action: true" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "email=$2" --data-urlencode "password=TestPass123" > /dev/null
}
login kg kg@test.com
login siswa siswa_coba@test.com
login tentor gondol@test.com
```

| # | Perintah | Harus gagal dengan |
|---|---|---|
| 7.1 | `curl -s -b siswa.txt -X POST localhost:5173/api/soal -H 'Content-Type: application/json' -d '{}'` | `403 Tidak diizinkan` |
| 7.2 | `curl -s -b tentor.txt -X POST localhost:5173/api/try-out -H 'Content-Type: application/json' -d '{}'` | `403 Tidak diizinkan` |
| 7.3 | `curl -s -b tentor.txt -X POST localhost:5173/api/attempt/<ATTEMPT_ID>/reset` | `403 Hanya kepala guru yang bisa reset attempt` |
| 7.4 | `curl -s -b siswa.txt -X POST localhost:5173/api/attempt/<ATTEMPT_ID>/reset` | `403 Hanya kepala guru...` |
| 7.5 | Siswa B submit attempt milik Siswa A | `403 Bukan attempt Anda` |
| 7.6 | Simpan jawaban setelah submit | `409 Attempt sudah disubmit` |
| 7.7 | Simpan jawaban setelah waktu habis | `409 Waktu sudah habis` + attempt langsung dinilai |
| 7.8 | Tentor input nilai untuk siswa yang tidak diajar | `403 Anda tidak mengajar siswa ini` |

**7.9 — Nilai tidak bisa dipalsukan.** Buka DevTools saat mengerjakan try out dan coba kirim nilai sendiri:

```js
await fetch('/api/attempt/<ATTEMPT_ID>', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nilai: 100 })
})
```

Nilai yang tersimpan harus tetap hasil hitungan server, **bukan 100**. Endpoint submit tidak menerima `nilai` dari klien sama sekali.

**7.10 — Kunci jawaban tidak bocor.** Saat try out sedang dikerjakan, cek response `/siswa/.../try-out/[id]` di Network tab: tidak boleh ada field `is_benar` di mana pun. Kunci baru dikirim setelah `submitted_at` terisi.

---

## Ringkasan Cakupan

Checklist Langkah 17 di `fase-2-execution.md` dipetakan ke:

| Item checklist | Bagian |
|---|---|
| Soal dengan jumlah pilihan berbeda | 1.1–1.2 |
| Tolak 0 atau >1 jawaban benar | 1.3–1.4 |
| Buat try out + jadwal + kelas | 2.1–2.2 |
| Tolak pre_test kedua | 2.4 |
| Soal tidak terlihat sebelum waktu buka | 4.1–4.2, 7.10 |
| Latihan bisa diulang | 3.2–3.3 |
| Timer + auto-save | 4.5–4.6 |
| Tutup browser → auto-submit | 4.13–4.14 |
| Try out tidak bisa dua kali | 4.9 |
| Tidak mengerjakan → nilai 0 | 4.15 |
| Pembulatan ke atas | 4.10 |
| Review setelah submit | 4.7–4.8 |
| Nilai manual hanya siswa yang diajar | 5.3, 7.8 |
| KG reset, attempt lama tersimpan | 6.1–6.2 |
| Tentor tidak bisa reset | 6.4, 7.3 |

---

## Catatan Untuk Fase Berikutnya

- **Belum ada RLS di database.** Semua otorisasi ada di endpoint `/api/*`. Siapa pun yang punya anon key masih bisa menulis langsung ke tabel lewat PostgREST, melewati aplikasi. Sebelum dipakai produksi, tambahkan RLS policy per tabel.
- **Auto-submit berjalan saat halaman try out dibuka**, bukan lewat scheduled job. Attempt yang ditinggalkan baru tertutup saat ada yang membuka halaman try out itu. Cukup untuk skala ~50 siswa; kalau perlu pasti, jadwalkan cron yang memanggil `autoSubmitExpired`.
