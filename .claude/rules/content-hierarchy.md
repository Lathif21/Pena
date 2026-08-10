---
paths:
  - "**/features/module/**"
  - "**/routes/(kepala-guru)/konten/**"
  - "**/routes/(siswa)/mapel/**"
  - "**/routes/(tentor)/modul/**"
  - "supabase/migrations/**"
---

# Content Hierarchy

## Structure

```
Mapel ──(many-to-many)── Kelas
  └── Materi
        ├── Try Out (Fase 2 — soal dibangun nanti, tapi materi jadi wadahnya)
        └── Sub Materi
              ├── Module (1 PDF)
              └── Latihan Soal (Fase 2)
```

## Mapel ↔ Kelas Scoping

**There is no `tingkat` column anywhere.** Scoping is an explicit many-to-many relation between `mapel` and `kelas` via the `mapel_kelas` join table.

One mapel may be used by several kelas, and one kelas has several mapel. "IPA" is a single row linked to every kelas that studies it — no duplicate mapel rows per grade level, and no numeric level to keep in sync.

This prevents content bleed the same way tingkat did: a student only ever sees mapel linked to their own kelas. Parallel classes (5A and 5B) simply both link to the same mapel and therefore share content.

KG sets these links from the mapel form (checkbox list of kelas).

## Student Content Query

A student's visible mapel set follows the relation:

```
siswa → siswa_kelas → kelas → mapel_kelas → mapel
```

A student with no `siswa_kelas` row sees no mapel — including `paket = 'privat'` students. Private students must still be linked to a kelas to receive e-learning content.

Only `materi`, `sub_materi`, and `module` are built in Phase 1. Soal (latihan and try out) come in Phase 2, but their parent structure (`materi` for try out, `sub_materi` for latihan) must exist first.

## Ordering

Both `materi` and `sub_materi` carry `nomor_urut integer not null`. Display sorted ascending. `kepala_guru` sets this manually via number input — no drag-and-drop in this phase.

## Draft / Published State

Every publishable item (`module`, and later `latihan_soal`, `try_out`) has:

```sql
status text not null default 'draft' check (status in ('draft', 'published'))
published_at timestamptz
```

Rules:

- Only `kepala_guru` can transition `draft` → `published`
- Once `published`, the item is **locked** — no edit, no delete, no un-publish. This is intentional: it prevents content changing under a student who is mid-way through it.
- If a mistake is found after publishing, the fix is to create a corrected replacement item and leave the old one published (do not delete history that a student may have already seen).

## Visibility to Students

A `materi` or `sub_materi` is visible to a student only if it contains **at least one published item**. An empty or all-draft materi does not appear in student navigation — it simply doesn't render, no "no content" placeholder needed at this stage.

Query pattern: join from `sub_materi` to `module` and check `status = 'published'`; a `materi` is visible if any of its `sub_materi` are visible, OR it has a published `try_out` (Phase 2).

## Module (PDF)

- Exactly one PDF per `sub_materi`. If `kepala_guru` uploads a second PDF, it replaces the first — but only while `status = 'draft'`.
- **Stored on the server filesystem, not Supabase Storage** — object storage was dropped on cost grounds. Files live in `pena_web/static/uploads/pdfs/`, and `module.storage_path` holds the path relative to `static/` (e.g. `uploads/pdfs/{sub_materi_id}-{timestamp}.pdf`).
- SvelteKit serves `static/` at the web root, so the public URL is simply `/{storage_path}`. There is no signing step — never call `supabase.storage` for modules.
- Uploads go through `POST /api/modul/[subId]`, which checks the session and `kepala_guru` role, rejects a non-uuid `subId` (the id becomes part of the filename), enforces PDF type and the size cap, and refuses to overwrite a `published` module.
- Max file size: 20MB (internal product, keep it simple — no video, no transcoding)
- Accepted type: `.pdf` only

## Tentor Visibility

`tentor` can view `module` content for `materi`/`mapel` they are assigned to (via `tentor_kelas_mapel` or `tentor_siswa_privat`), regardless of publish status is NOT allowed — tentor sees only `published` content, same as students. This keeps review/prep aligned with what students will actually see.

## Database Schema

```sql
-- Relasi mapel <-> kelas (menggantikan kolom tingkat, yang sudah di-drop)
create table mapel_kelas (
  mapel_id uuid not null references mapel(id),
  kelas_id uuid not null references kelas(id),
  created_at timestamptz not null default now(),
  primary key (mapel_id, kelas_id)
);

create index idx_mapel_kelas_kelas on mapel_kelas(kelas_id);

create table materi (
  id uuid primary key default gen_random_uuid(),
  mapel_id uuid not null references mapel(id),
  nama text not null,
  nomor_urut integer not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_materi_mapel on materi(mapel_id);

create table sub_materi (
  id uuid primary key default gen_random_uuid(),
  materi_id uuid not null references materi(id),
  nama text not null,
  nomor_urut integer not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_sub_materi_materi on sub_materi(materi_id);

create table module (
  id uuid primary key default gen_random_uuid(),
  sub_materi_id uuid not null references sub_materi(id) unique,
  storage_path text not null,  -- relative to static/, e.g. uploads/pdfs/<subId>-<ts>.pdf
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_module_sub_materi on module(sub_materi_id);
create index idx_module_status on module(status) where deleted_at is null;
```

Note: `module.sub_materi_id` is `unique` — enforces exactly one module per sub_materi at the database level.
