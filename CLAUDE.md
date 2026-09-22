# CLAUDE.md

Guidance for Claude Code when working in the **Pena** repository.

## Product Overview

Pena is an **internal e-learning platform** for one bimbingan belajar (tutoring center). ~50 students, 5 tentor, 1 Kepala Guru. Not a SaaS product, not sold externally.

## Repository Layout

```
pena_web/        SvelteKit responsive web app — all roles
db/              schema.sql — sumber kebenaran skema PostgreSQL
supabase/        Migration lama, disimpan sebagai riwayat saja
docs/            Product decisions, phase execution guides
```

The app uses **feature-first folder structure**. See `.claude/rules/structure-web.md`.

## Tech Stack

- **Web:** SvelteKit + Tailwind CSS, adapter-node
- **Database:** PostgreSQL mandiri di VPS, lewat PostgREST di loopback
- **Auth:** sendiri — `app_users` + `sessions`, scrypt bawaan Node
- **Berkas:** disk VPS di balik signed URL ber-HMAC
- **Email:** SMTP (relief person notifications only)

Supabase tidak dipakai lagi sama sekali.

## Roles

Four roles. Never add a fifth without an ADR.

| Role | Scope |
|---|---|
| `kepala_guru` | Owner & admin. CRUD all accounts/classes/subjects. Builds content hierarchy (materi → sub materi → module + soal). Schedules try outs. Reviews journals. Configures KPI. Can also teach (accesses tentor dashboard). |
| `tentor` | Teacher. Self-attendance (photo upload), student attendance (checklist), manual grade input, teaching journal, view modules, relief person. |
| `siswa` | Learner (grades 5-9 use e-learning). View PDF modules, take PG quizzes (latihan + try out), view grades and attendance. |
| `wali_murid` | Parent/guardian (read-only). View child's grades, progress charts, attendance. One account may cover multiple children. Registered by kepala_guru. |

`kepala_guru` chooses **Dashboard Kepala Guru** or **Dashboard Tentor** at login.

## Content Hierarchy

```
Mata Pelajaran (mapel)
  └── Materi (ordered by nomor_urut)
        ├── Try Out (PG, timed, single attempt, scheduled by KG)
        └── Sub Materi (ordered by nomor_urut)
              ├── Module (1 PDF per sub materi)
              └── Latihan Soal (PG, unlimited retries, untimed)

Latihan is practice only: never counts toward KPI, never in the wali chart. Only try outs tagged `pre_test` or `post_test` feed KPI.
```

All content items have `draft` / `published` status. Only `kepala_guru` publishes. A published **module** can be pulled back to draft ("Batalkan Publish") and revised. A published **try out** can too, but only until its window closes — after `waktu_buka + durasi_menit` it is locked permanently, soal included.

## Student Packages

Two packages: `regular` and `privat`. One student = one package.

- Regular: assigned to a `kelas`, normal class size
- Privat: assigned directly to `tentor + mapel` (no kelas), one per session

Both can access e-learning. Privat students have no attendance records.

## Non-Negotiable Rules

1. **Never hard-delete.** Every transactional table carries `tahun_ajaran_id` and `deleted_at`. Resetting an academic year means switching the active year, never dropping rows.
2. **All quizzes are PG (multiple choice) only.** No essay, no rubric, no AI grading.
3. **Content requires explicit publish.** Nothing is visible to students until `kepala_guru` presses Publish. Materi/Sub Materi only appear to students when they contain at least one published item inside.
4. **Tentor must submit self-attendance before student attendance.** This is enforced, not suggested.
5. **Journal is mandatory before "Selesai Mengajar".** Enforced with a precondition check.
6. **No AI features in current scope.** No auto-generation, no pre-grading, no AI evaluation.

## Domain Vocabulary

Use Indonesian domain terms in code, not translations.

- `tentor` — tutor/teacher
- `mapel` — mata pelajaran (subject)
- `materi` — topic within a subject
- `sub_materi` — subtopic within materi
- `modul` — PDF learning material, one per sub_materi
- `latihan_soal` — practice quiz (PG, unlimited retries)
- `try_out` — timed exam (PG, single attempt)
- `presensi` — attendance
- `jurnal_mengajar` — teaching journal
- `wali_murid` — parent/guardian
- `paket` — student package (regular/privat)
- `kelas` — class · `tahun_ajaran` — academic year
- `NIS` — student identification number

## Key Workflows

Detailed rules in `.claude/rules/`, loaded when touching related files.

- Auth and roles → `.claude/rules/auth-roles.md`
- Database conventions → `.claude/rules/database.md`
- Web structure → `.claude/rules/structure-web.md`
- Visual design → `.claude/rules/design-system.md`
- Content hierarchy → `.claude/rules/content-hierarchy.md`
- Soal & penilaian → `.claude/rules/soal-grading.md`
- Sesi mengajar → `.claude/rules/sesi-mengajar.md`

## Skills

`supabase-postgres-best-practices` dipasang lewat `skills-lock.json`. Installer
menulis dua salinan identik (`.agents/skills/` dan `.claude/skills/`) untuk
kompatibilitas antar tool — mirror, bukan skill berbeda. Jangan edit langsung.

## Working Practices

- Keep every `CLAUDE.md` and rule file under 200 lines.
- Solo developer, part-time. Favor boring, reviewable solutions over clever ones.
- Feature-first folder structure. One feature = one folder. Separate git commits
  per file, atau per satuan yang bisa ditinjau sendiri kalau perubahannya besar.
- Jangan membuat file laporan status (`*-complete.md`, `*-status.md`,
  `*-final.md`) setelah menyelesaikan pekerjaan. Progres dicatat lewat commit
  git. Dokumen per fase cukup dua: execution guide dan testing guide.

## Build the Laziest Thing That Works

The best code is the code never written. Before writing anything, walk this ladder and stop at the first rung that holds:

1. **Does this need to exist at all?** Speculative need — skip it, say so in one line.
2. **Does the standard library or Svelte/Postgres already do it?** Use it.
3. **Does a native platform feature cover it?** `<input type="date">` over a date-picker library. CSS over JS. A Postgres constraint over application-level validation.
4. **Does an already-installed dependency solve it?** Use it. Never add a new package for what a few lines can do.
5. **Only then:** the minimum code that works.

Rules that follow from this:

- No abstractions nobody asked for: no interface with one implementation, no config for a value that never changes, no scaffolding "for later."
- Deletion over addition. Boring over clever.
- Mark deliberate simplifications with a `// ponytail:` comment naming the ceiling and the upgrade path — e.g. `// ponytail: client-side search, fine under ~200 materi`. This makes simplicity read as intent rather than oversight.
- If the explanation of a simplification is longer than the code, delete the explanation.

### Where Laziness Does Not Apply

**Never simplify away these, in any phase:**

- **Feature-first folder structure.** More files is the point here — it exists so a solo reviewer can hold one feature in their head. "Fewest files" does not override `structure-web.md`.
- **Server-authoritative try out timer.** A client-only countdown is bypassable from DevTools.
- **Hiding try out questions before the open time.** Fetching everything and hiding it with CSS leaks the questions in the network tab.
- **Verifying a tentor teaches the student before accepting a grade.** A role claim alone is not authorization.
- **Soft-delete and `tahun_ajaran_id` on transactional tables.** Skipping these is cheap today and expensive at year rollover.
- Input validation at trust boundaries, error handling that prevents data loss, and accessibility basics.

Non-trivial logic (score calculation, timer expiry, tingkat filtering) leaves one runnable check behind — the smallest thing that fails if the logic breaks. No test frameworks, no fixtures, unless asked.

## Current Phase

Phase 5 — tinggal rekap tahun ajaran. Phase 0-4 selesai, Phase 5 selesai kecuali
rekap tahun ajaran (KPI, konfigurasi bobot, overview harian, laporan cetak per
siswa sudah jalan). Restyle ke design system baru selesai. Aplikasi jalan di VPS
sendiri dengan PostgreSQL, bukan Supabase.

KPI dihitung dari data sungguhan. Aritmetikanya di `features/kpi/data/hitung.js`
dengan pemeriksaan di `scripts/cek-kpi.mjs` — jalankan itu setelah menyentuh
rumusnya.

## Arsitektur Backend

Tidak ada RLS, dan itu disengaja: otorisasi sepenuhnya di kode server. Yang
menahannya adalah **tidak ada jalur dari browser ke database** — PostgREST hanya
mendengar di `127.0.0.1:3001` dan tidak pernah di-proxy Caddy. Semua query lewat
`+page.server.ts`, form action, atau endpoint `/api/*` yang memeriksa peran
lewat `buatEndpoint`.

**Jangan pernah menambahkan client database yang bisa diimpor kode browser.**
Dulu 16 modul data memanggil Supabase langsung dari browser dengan anon key.
Tanpa RLS, siapa pun yang membaca kunci itu dari bundle JS bisa membaca dan
menulis seluruh tabel — termasuk kunci jawaban di `pilihan_jawaban.is_benar`.
Itulah sebabnya pola `buatEndpoint` ada.

## Storage

Berkas unggahan ada di `STORAGE_DIR` pada disk VPS — di luar `static/` dan di
luar folder aplikasi, jadi tidak pernah tersaji langsung dan tidak terhapus saat
redeploy. Satu-satunya cara membacanya lewat `/api/berkas/...` dengan tanda
tangan HMAC yang kedaluwarsa. Endpoint itu sengaja tidak memeriksa sesi: tanda
tangannya yang jadi otorisasi, supaya tautannya bisa dipakai `<img>`/`<iframe>`.

## Utang Teknis yang Diketahui

- **Lima modul perlu diunggah ulang.** Lima baris dengan `storage_path` warisan
  `uploads/pdfs/...` filenya sudah hilang sejak sebelum pindah ke VPS dan
  diturunkan ke `draft`. Tidak ada yang bisa dipulihkan — harus diunggah ulang.
- **`/siswa/nilai` belum ada.** Nav siswa hanya memuat 2 dari 5 item yang
  didaftarkan `design-system.md`; Latihan Soal dan Ujian sengaja lewat sub
  materi, tapi Nilai Saya belum pernah dibangun (sisa Fase 2).

## Deferred (Do Not Build Yet)

- Rekap tahun ajaran (pemilih tahun + arsip baca-saja) — sisa Phase 5, tunggu
  tahun ajaran kedua supaya bisa diuji
- Export massal ZIP per siswa — cetak satu per satu sudah cukup
- Scheduling privat, in-app chat, multi-tenancy, gamification — belum
