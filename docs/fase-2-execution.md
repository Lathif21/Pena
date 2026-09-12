# Fase 2 — Runtutan Eksekusi

Cara pakai: buka Claude Code di folder `pena/`, minta ikuti langkah-langkah ini.
`CLAUDE.md`, `.claude/rules/soal-grading.md`, dan `.claude/rules/design-system.md` terbaca otomatis.

Prasyarat: Fase 1 selesai — materi, sub materi, modul PDF, dan alur draft/publish sudah jalan.

---

## Langkah 1 — Migration: Soal & Pilihan Jawaban

```bash
supabase migration new create_soal
```

Tabel `soal` dan `pilihan_jawaban` sesuai schema di `.claude/rules/soal-grading.md`.

Perhatikan constraint `check (num_nonnulls(sub_materi_id, materi_id) = 1)` — satu soal hanya boleh punya satu induk: sub materi (latihan) atau materi (try out), tidak boleh keduanya atau kosong.

```bash
supabase db push
```

## Langkah 2 — Migration: Try Out

```bash
supabase migration new create_try_out
```

Tabel `try_out` (dengan `tipe_test`, `waktu_buka`, `durasi_menit`, `status`) dan `try_out_kelas` (many-to-many ke kelas).

## Langkah 3 — Migration: Attempt & Jawaban

```bash
supabase migration new create_attempt
```

Tabel `attempt` (dengan `is_active` untuk reset) dan `jawaban_siswa`.

## Langkah 4 — Migration: Nilai Manual

```bash
supabase migration new create_nilai_manual
```

Tabel `nilai_manual` — tipe_test, judul, tanggal, nilai, catatan opsional.

## Langkah 5 — Struktur Folder

```bash
cd pena_web
mkdir -p src/features/question/{components,data}
mkdir -p src/features/grading/{components,data}
```

## Langkah 6 — API: Soal Builder

`src/features/question/data/soal.ts`:
- `listSoalBySubMateri(subMateriId)` / `listSoalByMateri(materiId)`
- `createSoal(parentId, parentType, pertanyaan, pilihan[])` — pilihan jumlahnya bebas, tepat satu `is_benar = true`
- `updateSoal(id, ...)` — hanya jika induknya masih draft
- `softDeleteSoal(id)`

Validasi wajib: minimal 2 pilihan, tepat 1 jawaban benar.

## Langkah 7 — API: Try Out

`src/features/question/data/try-out.ts`:
- `createTryOut(materiId, judul, tipeTest, waktuBuka, durasiMenit, kelasIds[])`
- `publishTryOut(id)` — tolak jika belum ada soal
- Validasi `pre_test`: cek belum ada try out `pre_test` lain untuk mapel yang sama

## Langkah 8 — API: Attempt & Auto-Grade

`src/features/question/data/attempt.ts`:
- `startAttempt(siswaId, tryOutId | subMateriId)` — untuk try out, cek jendela waktu; tolak jika sudah ada attempt aktif
- `saveJawaban(attemptId, soalId, pilihanId)` — simpan incremental, dipanggil tiap siswa pilih jawaban
- `submitAttempt(attemptId)` — hitung nilai `CEIL((benar/total) × 100)`, set `submitted_at`
- `resetAttempt(attemptId)` — **hanya KG**, set `is_active = false` pada attempt lama, buat attempt baru

Auto-submit saat waktu habis: cek server-side di `submitAttempt`, dan buat scheduled job atau cek saat query untuk attempt yang lewat `started_at + durasi`.

## Langkah 9 — API: Nilai Manual

`src/features/grading/data/nilai-manual.ts`:
- `listSiswaByTentor(tentorId, mapelId)` — gabungan dari `tentor_kelas_mapel` dan `tentor_siswa_privat`
- `createNilaiManual(...)` — validasi tentor memang mengajar siswa tersebut
- `listNilaiManual(siswaId, mapelId)`

## Langkah 10 — UI KG: Builder Soal Latihan

`kepala-guru/konten/.../sub-materi/[id]/soal/+page.svelte`

Referensi visual: `docs/design-reference/Create_Try_Out_or_Quiz.png` — sidebar daftar soal di kiri, editor soal di kanan.

- Daftar soal (nomor urut, preview pertanyaan)
- Editor: textarea pertanyaan, list pilihan jawaban (tambah/hapus dinamis), radio untuk tandai jawaban benar
- Tombol Publish (mengunci soal, sesuai aturan draft/published Fase 1)

## Langkah 11 — UI KG: Builder Try Out

`kepala-guru/konten/.../materi/[id]/try-out/+page.svelte`

Sama seperti langkah 10, plus form penjadwalan:
- Judul try out
- Dropdown `tipe_test`: Biasa / Pre-Test / Post-Test
- Datetime picker `waktu_buka`
- Input `durasi_menit`
- Multi-select kelas target

## Langkah 12 — UI Siswa: Kerjakan Latihan

`siswa/mapel/[mapelId]/materi/[materiId]/sub-materi/[id]/latihan/+page.svelte`

- Tampilkan soal satu per satu atau semua sekaligus (pilih salah satu, konsisten)
- Radio button pilihan jawaban
- Tombol Submit → nilai langsung muncul
- Tombol "Ulangi" tersedia (latihan bebas diulang)

## Langkah 13 — UI Siswa: Kerjakan Try Out

`siswa/mapel/[mapelId]/materi/[materiId]/try-out/[id]/+page.svelte`

Ini halaman paling kompleks di fase ini:
- Cek server-side: apakah dalam jendela waktu? Apakah sudah pernah attempt?
- Countdown timer (display only — server yang otoritatif)
- Auto-save jawaban tiap kali siswa memilih
- Submit manual atau auto-submit saat waktu habis
- Setelah submit: tampilkan nilai + mode review (soal, jawaban siswa, jawaban benar)

## Langkah 14 — UI Tentor: Input Nilai Manual

`tentor/nilai/input/+page.svelte`

- Dropdown mapel (dari mapel yang tentor pegang)
- Dropdown tipe test: Pre-Test / Try Out / Post-Test
- Input judul dan tanggal
- Tabel daftar siswa dengan input nilai per siswa + catatan opsional
- Submit → langsung final

## Langkah 15 — UI Tentor: Lihat Nilai Siswa

`tentor/nilai/+page.svelte`

- Gabungan nilai e-learning (try out) + nilai manual
- Filter per mapel, per kelas
- Rata-rata per siswa dan per kelas

## Langkah 16 — UI KG: Reset Attempt

`kepala-guru/monitoring/attempt/+page.svelte`

- Daftar attempt try out per siswa
- Tombol Reset (dengan confirmation popup)
- Tampilkan riwayat attempt yang sudah di-reset (`is_active = false`)

## Langkah 17 — Testing

```
[ ] KG buat soal latihan dengan jumlah pilihan berbeda (3, 4, 5)
[ ] Validasi: tolak soal dengan 0 atau >1 jawaban benar
[ ] KG buat try out, pilih tipe test, jadwalkan, pilih kelas
[ ] Validasi: tolak pre_test kedua untuk mapel yang sama
[ ] Siswa TIDAK bisa lihat soal try out sebelum waktu buka
[ ] Siswa kerjakan latihan, bisa ulangi berkali-kali
[ ] Siswa kerjakan try out, timer jalan, auto-save berfungsi
[ ] Tutup browser di tengah try out → waktu habis → auto-submit
[ ] Siswa tidak bisa kerjakan try out dua kali
[ ] Siswa yang tidak mengerjakan sampai jadwal habis → nilai 0
[ ] Nilai dibulatkan ke atas (2/3 soal → 67, bukan 66)
[ ] Setelah submit try out, siswa bisa review soal + jawaban
[ ] Tentor input nilai manual, hanya untuk siswa yang dia ajar
[ ] KG bisa reset attempt, attempt lama tersimpan is_active=false
[ ] Tentor TIDAK bisa reset attempt
```

---

## Urutan Prioritas Jika Terbatas Waktu

1. Langkah 1-4 (migration) — wajib
2. Langkah 6-8 (API soal, try out, attempt) — wajib
3. Langkah 10-11 (builder KG) — wajib, tanpa ini tidak ada soal
4. Langkah 13 (try out siswa) — wajib, ini inti fase
5. Langkah 12 (latihan siswa) — wajib
6. Langkah 14 (input nilai manual) — wajib untuk KPI nanti
7. Langkah 15 (lihat nilai tentor) — bisa ditunda
8. Langkah 16 (reset attempt) — bisa ditunda, sementara KG edit manual di Supabase
