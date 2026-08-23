---
paths:
  - "**/features/attendance/**"
  - "**/features/journal/**"
  - "**/features/session/**"
  - "**/routes/(tentor)/**"
  - "**/routes/(kepala-guru)/monitoring/**"
  - "**/routes/api/**"
  - "supabase/migrations/**"
---

# Sesi Mengajar

One teaching session covers one kelas at one point in time. A tentor teaching three classes in a day opens and closes three separate sessions.

## Session Lifecycle

```
open (presensi tentor submitted)
  |-- presensi murid (checklist)
  `-- jurnal mengajar (draft)
        `-- Selesai Mengajar -> closed
```

Presensi murid is blocked until presensi tentor exists. Selesai Mengajar is blocked until jurnal exists. Everything else is reachable in any order.

## Authorization Pattern

There is **no RLS** in this project. All authorization lives in `/api/*` server endpoints, following the pattern established in Phase 2. Every endpoint verifies the role claim and the ownership relation before touching data.

| Action | Rule |
|---|---|
| Open sesi | Tentor must teach that kelas + mapel via `tentor_kelas_mapel` |
| Presensi murid | Sesi must exist, belong to the calling tentor, and still be `open` |
| Jurnal | Same ownership check as presensi murid |
| Selesai Mengajar | Same, plus jurnal must exist |
| KG monitoring | `kepala_guru` role only |

A `kepala_guru` using the tentor dashboard passes these checks the same way a tentor does — the ownership relation is what matters, not the role name.

## Presensi Tentor

Tentor uploads a photo taken with **Timestamp Camera Free**, a third-party app that burns date, time, and location into the image. Pena does not parse that burned-in data — it is evidence for KG to read, not a field.

- Form: kelas (dropdown, only classes this tentor teaches), mapel (filtered by selected kelas via `mapel_kelas`), photo
- System records `uploaded_at` separately from whatever the photo shows
- The gap between the two tells KG whether the upload was prompt or late — surface **both**, never just one
- One photo per sesi; re-uploading replaces the file only while the sesi is `open`
- Uploading the photo **is** the attendance record. There is no separate check-in step.

**Presensi tentor does not feed KPI.** It exists for KG oversight only.

## Presensi Murid

- Loads students in the sesi's kelas via `siswa_kelas`
- Checkbox per student, defaulting to hadir
- **Privat students never appear** — they have no kelas and no attendance anywhere in the system
- One row per student, so a student's history is queryable
- Editable while sesi is `open`; locked once closed

## Jurnal Mengajar

- Dropdown: materi for the sesi's mapel (`materi` filtered by `mapel_id`)
- Textarea: free-text notes
- Saved as `draft`; becomes `submitted` only when Selesai Mengajar runs

KG reads journals and judges them qualitatively. There is **no approve/reject control** — the system records, KG evaluates.

Journal completeness feeds KPI in Phase 5: percentage of sessions whose journal reached `submitted`.

## Selesai Mengajar

Final action for one sesi. Requires a confirmation dialog.

**Precondition:** a `jurnal_mengajar` row exists for this sesi. Block otherwise and name the missing step rather than failing silently.

**Effects must be atomic.** Use a Postgres function (RPC), not three sequential client calls. A half-closed sesi corrupts KPI later.

1. `sesi_mengajar.ended_at = now()`, status -> `closed`
2. Presensi murid locked
3. Jurnal `draft` -> `submitted`, `submitted_at` set

Once closed the sesi is read-only for tentor. No reopen flow in this phase.

## Relief Person

Deferred to Phase 4. Do not build the relief form, substitute assignment, or SMTP notification in this phase.

## Schema

```sql
create table sesi_mengajar (
  id uuid primary key default gen_random_uuid(),
  tentor_id uuid not null references profiles(id),
  kelas_id uuid not null references kelas(id),
  mapel_id uuid not null references mapel(id),
  foto_path text not null,
  uploaded_at timestamptz not null default now(),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'open' check (status in ('open', 'closed')),
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_sesi_tentor on sesi_mengajar(tentor_id);
create index idx_sesi_kelas on sesi_mengajar(kelas_id);
create index idx_sesi_status on sesi_mengajar(status) where deleted_at is null;

create table presensi_murid (
  id uuid primary key default gen_random_uuid(),
  sesi_id uuid not null references sesi_mengajar(id),
  siswa_detail_id uuid not null references siswa_detail(id),
  is_hadir boolean not null,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  unique (sesi_id, siswa_detail_id)
);

create index idx_presensi_siswa on presensi_murid(siswa_detail_id);

create table jurnal_mengajar (
  id uuid primary key default gen_random_uuid(),
  sesi_id uuid not null references sesi_mengajar(id) unique,
  materi_id uuid not null references materi(id),
  deskripsi text not null,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  submitted_at timestamptz,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

`jurnal_mengajar.sesi_id` is `unique` — exactly one journal per sesi, enforced at the database level, not in application code.

## File Storage

Attendance photos go to Supabase Storage bucket `presensi-foto`, path `{tahun_ajaran_id}/{sesi_id}.jpg`.

**Never store uploads under `static/`.** Anything in `static/` is served publicly with no authentication — attendance photos carry a tentor's location and time, and module PDFs are internal content. Both must sit behind a signed URL.

Bucket settings: private, max 5MB, `image/jpeg` and `image/png` only. KG and the owning tentor read via signed URL.
