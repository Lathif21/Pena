# Relief Person — Runtutan Eksekusi

Sisa pekerjaan Fase 4. Aturan lengkap ada di `.claude/rules/relief-person.md` (terbaca otomatis).

Prasyarat: Fase 3 selesai — sesi mengajar, presensi, jurnal sudah jalan.

**Commit setiap selesai satu langkah.** `git add . ; git commit -m "feat: <langkah>"`

---

## Langkah 1 — Migration

```bash
supabase migration new create_relief
```

Tabel `relief` sesuai schema di `.claude/rules/relief-person.md`. Perhatikan:

- `check (tentor_asli_id <> pengganti_id)` — tidak bisa menunjuk diri sendiri
- Unique index parsial: satu relief aktif per tentor + kelas + mapel + tanggal
- `grant all privileges` — tanpa ini setiap query balas "permission denied", sama seperti tabel Fase 3

```bash
supabase db push
```

## Langkah 2 — Setup SMTP

Tambahkan dependency dan environment variable:

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

```bash
# pena_web/.env — tanpa prefix PUBLIC_, server-only
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="Pena <noreply@...>"
```

Gmail butuh App Password, bukan password akun biasa. Kalau bimbel sudah punya domain sendiri, pakai SMTP penyedia domain itu.

Buat `src/lib/email/client.ts` — satu transporter, dipakai ulang. Jangan bikin transporter baru tiap kirim.

**Uji dulu sebelum lanjut:** kirim satu email percobaan lewat script kecil. Kalau SMTP belum benar, seluruh Langkah 5 akan gagal dan kamu tidak akan tahu penyebabnya.

## Langkah 3 — Struktur Folder

```powershell
cd pena_web
New-Item -ItemType Directory -Force -Path "src/features/relief/components"
New-Item -ItemType Directory -Force -Path "src/features/relief/data"
New-Item -ItemType Directory -Force -Path "src/lib/email"
New-Item -ItemType Directory -Force -Path "src/routes/tentor/relief"
New-Item -ItemType Directory -Force -Path "src/routes/api/relief"
New-Item -ItemType Directory -Force -Path "src/routes/kepala-guru/monitoring/relief"
```

## Langkah 4 — API: Relief

`src/features/relief/data/relief.ts`:

- `listTentorLain(tentorId)` — role `tentor`, `deleted_at is null`, kecuali diri sendiri
- `listKelasMapelByTentor(tentorId)` — dari `tentor_kelas_mapel`, untuk dropdown
- `createRelief(tentorAsliId, penggantiId, kelasId, mapelId, tanggal, task)`
- `listReliefByTentor(tentorId)` — yang dia ajukan
- `listReliefUntukSaya(penggantiId)` — yang ditugaskan ke dia, `tanggal >= today`
- `cancelRelief(id)` — tolak kalau sudah ada sesi yang dibuka lewat relief ini
- `getReliefAktif(penggantiId, kelasId, mapelId, tanggal)` — dipakai pengecekan otorisasi

Validasi di endpoint `/api/relief`:

- Tanggal tidak boleh di masa lalu
- Tentor asli harus benar mengajar kelas + mapel itu (`tentor_kelas_mapel`)
- Pengganti harus tentor aktif dan bukan diri sendiri
- Task tidak boleh kosong

## Langkah 5 — Email

`src/lib/email/relief.ts`:

- `kirimReliefBaru(relief)` — ke pengganti dan kepala guru
- `kirimReliefDibatalkan(relief)` — ke dua penerima yang sama

Isi: nama tentor asli, kelas, mapel, tanggal, task delegasi, tautan ke `/tentor/dashboard`.

**Kegagalan email tidak boleh membatalkan relief.** Bungkus pengiriman dalam try/catch, simpan pesan errornya ke `relief.email_error`, kembalikan relief sebagai berhasil dengan penanda peringatan. Endpoint tetap balas 200.

## Langkah 6 — Otorisasi Sesi Lewat Relief

Ini perubahan pada kode Fase 3 yang sudah ada, bukan kode baru — kerjakan hati-hati.

Di endpoint pembuka sesi (`/api/sesi`), pengecekan sekarang berbunyi kira-kira "tentor terdaftar di `tentor_kelas_mapel`". Ubah jadi dua jalur:

```
boleh = terdaftarDiTentorKelasMapel(tentorId, kelasId, mapelId)
     || adaReliefAktif(tentorId, kelasId, mapelId, hariIni)
```

`adaReliefAktif` mencocokkan `pengganti_id`, `kelas_id`, `mapel_id`, `tanggal = current_date`, `status = 'aktif'`, `deleted_at is null`.

Jangan sentuh pengecekan lain. Presensi murid, jurnal, dan Selesai Mengajar tetap memakai kepemilikan sesi — pengganti memiliki sesi yang dia buka, jadi lolos tanpa perubahan.

Commit terpisah dari langkah lain. Kalau ada yang salah di sini, kamu ingin bisa revert satu commit tanpa membongkar fitur relief.

## Langkah 7 — UI Tentor: Ajukan Relief

`src/routes/tentor/relief/+page.svelte`

- Dropdown kelas + mapel (dari yang tentor ini ajar)
- Dropdown tentor pengganti
- Date picker, minimal hari ini
- Textarea task delegasi
- Daftar relief yang sudah diajukan, dengan tombol Batalkan selama belum ada sesi
- Kalau `email_error` terisi, tampilkan peringatan: relief tersimpan tapi email gagal, hubungi pengganti manual

Tambahkan menu **Relief** ke nav tentor.

## Langkah 8 — UI Tentor: Relief untuk Saya

Di `/tentor/dashboard`, tampilkan banner kalau ada relief aktif untuk hari ini:

- Nama tentor yang digantikan, kelas, mapel
- Task delegasi, ditampilkan menonjol
- Tautan langsung ke presensi diri untuk kelas itu

Di halaman presensi diri, kelas relief muncul di dropdown bersama kelas milik sendiri, diberi penanda "(relief)".

## Langkah 9 — UI Tentor: Modul Kelas Relief

Pengganti perlu melihat modul mapel tersebut. Halaman `/tentor/modul` sudah ada — perluas filternya supaya menyertakan mapel dari relief aktif hari ini, bukan hanya dari `tentor_kelas_mapel`.

Tampilkan seluruh modul `published` mapel itu. Sistem tidak tahu materi mana yang seharusnya diajarkan hari itu karena tidak ada jadwal; task delegasi adalah tempat tentor asli menuliskan arahannya.

## Langkah 10 — UI KG: Monitoring Relief

`src/routes/kepala-guru/monitoring/relief/+page.svelte`

- Tabel: tanggal, tentor asli, pengganti, kelas, mapel, task, status
- Filter per tanggal dan per tentor
- Tandai baris yang `email_error`-nya terisi

Tambahkan ke nav KG di bawah Sesi Mengajar.

## Langkah 11 — Testing

Ikuti `docs/relief-testing-guide.md`.

---

## Urutan Prioritas Jika Terbatas Waktu

1. Langkah 1, 4, 6 — migration, API, otorisasi. Tanpa ini relief tidak berfungsi sama sekali
2. Langkah 7 — form pengajuan
3. Langkah 8 — banner pengganti
4. Langkah 2, 5 — email. Bisa ditunda; sementara tentor mengabari pengganti lewat WhatsApp
5. Langkah 9, 10 — modul relief dan monitoring KG
