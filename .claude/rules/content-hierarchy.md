---
paths:
  - "**/features/module/**"
  - "**/routes/kepala-guru/konten/**"
  - "**/routes/siswa/mapel/**"
  - "**/routes/tentor/modul/**"
  - "supabase/migrations/**"
---

# Content Hierarchy

## Structure

```
Mapel (linked to one or more kelas via mapel_kelas)
  └── Materi
        ├── Try Out (Fase 2 — soal dibangun nanti, tapi materi jadi wadahnya)
        └── Sub Materi
              ├── Module (1 PDF)
              └── Latihan Soal (Fase 2)
```

## Kelas Scoping via mapel_kelas

Content visibility is scoped by a many-to-many relation between `mapel` and `kelas`, not by a `tingkat` column. KG ticks which kelas a mapel belongs to when creating the mapel.

```sql
create table mapel_kelas (
  mapel_id uuid not null references mapel(id),
  kelas_id uuid not null references kelas(id),
  primary key (mapel_id, kelas_id)
);
```

A student's visible mapel set comes from their kelas:

```
siswa -> siswa_kelas -> kelas -> mapel_kelas -> mapel
```

Consequences to keep in mind:

- A student with **no kelas sees no mapel at all**. When a student's subject list is unexpectedly empty, check `siswa_kelas` and `mapel_kelas` before suspecting anything else.
- **Privat students have no kelas**, so this path yields nothing for them. Their access must resolve through `tentor_siswa_privat.mapel_id` instead — handle privat as a separate branch, never as a special case of the kelas query.
- The same mapel row may serve several kelas. Editing its materi affects every kelas linked to it.

## Ordering

Both `materi` and `sub_materi` carry `nomor_urut integer not null`. Display sorted ascending. KG sets this manually via number input — no drag-and-drop in this phase.

## Draft / Published State

Every publishable item (`module`, `latihan_soal`, `try_out`) has:

```sql
status text not null default 'draft' check (status in ('draft', 'published'))
published_at timestamptz
```

- Only `kepala_guru` publishes.
- While `published`, the item is locked for editing. KG may **Batalkan Publish** to return it to `draft`, edit, then publish again — the item simply disappears from the student view while back in draft.
- For **try out**, this becomes permanent once the scheduling window passes: after `waktu_buka + durasi_menit`, unpublish, edit, and delete are all refused. Students have already sat the exam, and their scores must stay tied to the questions they actually answered.
- **Latihan soal is never locked** — it may be edited any time, since attempts are unlimited and carry no KPI weight.
- A try out that any student has already attempted cannot be deleted, even in draft.

## Visibility to Students

A `materi` or `sub_materi` is visible to a student only if it contains **at least one published item**. An empty or all-draft materi does not appear in student navigation — it simply doesn't render, no placeholder needed.

Query pattern: join from `sub_materi` to `module` and check `status = 'published'`; a `materi` is visible if any of its `sub_materi` are visible, OR it has a published `try_out`.

## Module (PDF)

- Exactly one PDF per `sub_materi`. If `kepala_guru` uploads a second PDF, it replaces the first — but only while `status = 'draft'`.
- Stored in Supabase Storage, bucket `modul-pdf`, path: `/{sub_materi_id}/{filename}`
- Max file size: 20MB (internal product, keep it simple — no video, no transcoding)
- Accepted type: `.pdf` only

## Tentor Visibility

`tentor` can view `module` content for `materi`/`mapel` they are assigned to (via `tentor_kelas_mapel` or `tentor_siswa_privat`), regardless of publish status is NOT allowed — tentor sees only `published` content, same as students. This keeps review/prep aligned with what students will actually see.

## Database Schema

```sql
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
  file_path text not null,
  file_size integer not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_module_sub_materi on module(sub_materi_id);
create index idx_module_status on module(status) where deleted_at is null;
```

Note: `module.sub_materi_id` is `unique` — enforces exactly one module per sub_materi at the database level.
