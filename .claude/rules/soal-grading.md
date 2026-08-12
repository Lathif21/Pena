---
paths:
  - "**/features/question/**"
  - "**/features/grading/**"
  - "**/routes/(kepala-guru)/konten/**"
  - "**/routes/(siswa)/**"
  - "**/routes/(tentor)/nilai/**"
  - "supabase/migrations/**"
---

# Soal & Penilaian

## Two Quiz Types

| | Latihan Soal | Try Out |
|---|---|---|
| Position | Per `sub_materi` | Per `try_out` (which sits on a `materi`) |
| Time limit | None | Yes, set by KG |
| Attempts | **Unlimited** | **Single** |
| Schedule | Available anytime once published | Only within scheduled window |
| Questions hidden before start | No | **Yes** |
| Counts toward KPI | **Never** | Only if tagged `pre_test` or `post_test` |
| Appears in wali progress chart | **No** | Yes |

Latihan exists to let students practice and learn. It is deliberately excluded from KPI and from the parent-facing chart so that repeated attempts carry no penalty.

## Question Format

All questions are multiple choice (PG). No essay, no short answer.

- Number of choices is **free per question** — KG may create 3, 4, 5, or more options for any given question
- Exactly one correct answer per question
- All questions carry **equal weight** — no per-question points in current scope

## Scoring

Score is 0–100, computed as `(jumlah_benar / jumlah_soal) × 100`, **rounded up** (`CEIL`).

Example: 2 correct out of 3 questions → `(2/3) × 100 = 66.67` → **67**.

Auto-graded immediately on submit. Student sees the score right away.

## Try Out Behavior

**Scheduling.** KG sets: open datetime, duration (minutes), target kelas (with per-kelas filter).

**Listing vs. contents.** A published try out targeting the student's kelas is **listed on the materi in every state** — students need to know an exam is coming. The card shows `belum_buka` (with the open datetime), `terbuka`, `selesai` (with the score), or `terlewat`. Only `terbuka` and `selesai` are clickable.

What stays hidden outside the window is the **soal**, not the try out's existence.

**Question visibility.** Questions must not be fetched to the client before the start time. Enforce server-side — a client-side "hide until start" is not sufficient, since the payload would already be in the browser. The try out loader returns early with `soal: []` when the window has not opened, so the questions are never queried, and `is_benar` is never sent until the student has submitted.

**Timer.** Server-authoritative. The client countdown is display only; the server records `started_at` and rejects submissions past `started_at + duration`.

**Abandonment.** If the student closes the browser mid-attempt, the timer keeps running. When time expires, whatever answers were saved are auto-submitted and graded. Save answers incrementally as the student selects them, not only on final submit.

**Never attempted.** A student who does not attempt a try out before its window closes receives a score of **0**, not null. This is deliberate: a missing attempt is a real outcome, and null would silently exclude them from averages and KPI.

## Test Type Tagging

Every try out carries a `tipe_test`:

```sql
tipe_test text not null check (tipe_test in ('biasa', 'pre_test', 'post_test'))
```

KG chooses this when creating the try out. Only `pre_test` and `post_test` feed KPI's Normalized Gain.

**One `pre_test` per siswa per mapel.** Enforce at the application level when KG creates a try out tagged `pre_test` for a mapel that already has one.

## Manual Grades

Tentor inputs grades from paper exams. These sit alongside e-learning grades — both are real, neither replaces the other.

```sql
create table nilai_manual (
  id uuid primary key default gen_random_uuid(),
  siswa_detail_id uuid not null references siswa_detail(id),
  mapel_id uuid not null references mapel(id),
  materi_id uuid references materi(id),         -- nullable: some exams span a whole mapel
  tipe_test text not null check (tipe_test in ('pre_test', 'try_out', 'post_test')),
  judul text not null,
  tanggal date not null,
  nilai integer not null check (nilai between 0 and 100),
  catatan text,
  tentor_id uuid not null references profiles(id),
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

A student may have multiple manual grades of the same `tipe_test` for the same mapel — they are distinguished by `judul` and `tanggal`. Manual grades are final on submit; no KG review.

Tentor may only input grades for students they teach — verify against `tentor_kelas_mapel` (reguler) or `tentor_siswa_privat` (privat), not just the role claim.

## Attempt Reset

Only `kepala_guru` may reset a try out attempt. Tentor cannot — a tentor whose try out is tagged `post_test` has a direct interest in the resulting score, so allowing self-service reset would compromise KPI integrity.

Reset creates a **new attempt row** and leaves the old one intact (`is_active = false`). The most recent attempt is the one that counts. No written reason is required.

Latihan needs no reset mechanism — students can simply retry.

## Schema

```sql
create table soal (
  id uuid primary key default gen_random_uuid(),
  sub_materi_id uuid references sub_materi(id),   -- set for latihan
  try_out_id uuid references try_out(id),         -- set for try out
  pertanyaan text not null,
  nomor_urut integer not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint soal_satu_induk
    check (num_nonnulls(sub_materi_id, try_out_id) = 1)  -- exactly one parent
);

create table pilihan_jawaban (
  id uuid primary key default gen_random_uuid(),
  soal_id uuid not null references soal(id),
  teks text not null,
  is_benar boolean not null default false,
  nomor_urut integer not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table try_out (
  id uuid primary key default gen_random_uuid(),
  materi_id uuid not null references materi(id),
  judul text not null,
  tipe_test text not null check (tipe_test in ('biasa', 'pre_test', 'post_test')),
  waktu_buka timestamptz not null,
  durasi_menit integer not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table try_out_kelas (
  try_out_id uuid not null references try_out(id),
  kelas_id uuid not null references kelas(id),
  primary key (try_out_id, kelas_id)
);

create table attempt (
  id uuid primary key default gen_random_uuid(),
  siswa_detail_id uuid not null references siswa_detail(id),
  try_out_id uuid references try_out(id),         -- set for try out
  sub_materi_id uuid references sub_materi(id),   -- set for latihan
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  nilai integer check (nilai between 0 and 100),
  is_active boolean not null default true,        -- false when superseded by a reset
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table jawaban_siswa (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempt(id),
  soal_id uuid not null references soal(id),
  pilihan_jawaban_id uuid references pilihan_jawaban(id),
  created_at timestamptz not null default now(),
  unique (attempt_id, soal_id)
);
```

## Soal Ownership

Try out soal hang off **`try_out_id`, not `materi_id`**. Two try outs on the same materi
therefore have independent question sets — adding a soal to one never touches the other.
This matters for pre_test/post_test on the same materi, which must be able to differ.

A published try out locks **only its own** soal (no add, edit, or delete); a draft
sibling on the same materi stays editable. See the lock rules under Content Hierarchy.

## Review After Submission

After submitting a try out, the student may review the questions alongside their own answers and the correct ones. This is allowed because try out is single-attempt — there is nothing left to game.
