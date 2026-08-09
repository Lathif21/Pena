---
paths:
  - "supabase/**"
  - "**/data/**"
  - "**/api.ts"
---

# Database Conventions

## Tahun Ajaran (Academic Year)

Every transactional table carries:

```sql
tahun_ajaran_id uuid not null references tahun_ajaran(id)
```

The `tahun_ajaran` table:

```sql
create table tahun_ajaran (
  id uuid primary key default gen_random_uuid(),
  nama text not null,          -- e.g. '2025/2026'
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
```

Only one row may have `is_active = true` at a time. Enforce with a partial unique index or trigger.

"Resetting" a year means setting a new row to `is_active = true` and the old one to `false`. No data is deleted.

## Soft Delete

Every table with user-facing data carries:

```sql
deleted_at timestamptz
```

All reads filter `deleted_at is null` unless explicitly querying archived data (rekap tahun ajaran). Never use SQL `DELETE`.

## Required Columns

Every table:

```sql
created_at timestamptz not null default now()
deleted_at timestamptz
```

Transactional tables additionally:

```sql
tahun_ajaran_id uuid not null references tahun_ajaran(id)
```

Transactional means: `nilai`, `presensi_tentor`, `presensi_murid`, `jurnal_mengajar`, `sesi_mengajar`, `kpi_snapshot`, `jawaban_siswa`.

## Master Data Tables

These are structural, not transactional. They carry `deleted_at` but not `tahun_ajaran_id`:

- `profiles` (users)
- `kelas`
- `mapel`
- `tentor_kelas_mapel` (assignment)
- `tentor_siswa_privat` (private student assignment)
- `wali_siswa` (parent-child link)
- `materi` (Phase 1)
- `sub_materi` (Phase 1)

## Naming

- Tables: `snake_case`, Indonesian terms as defined in CLAUDE.md vocabulary
- Columns: `snake_case`
- Foreign keys: `{referenced_table_singular}_id` — e.g. `mapel_id`, `kelas_id`, `tentor_id`
- Boolean columns: `is_` prefix — e.g. `is_active`, `is_published`
- Timestamps: `_at` suffix — e.g. `created_at`, `published_at`, `uploaded_at`

## Indexes

Create indexes on:
- Every foreign key column
- `tahun_ajaran_id` on transactional tables
- `deleted_at` (partial index where `deleted_at is null` for common queries)
- Composite indexes for common query patterns (e.g. `(kelas_id, mapel_id)`)

## Migrations

One migration file per logical change. Name: `YYYYMMDDHHMMSS_description.sql`.

Migrations are forward-only. Never edit a committed migration — create a new one to fix mistakes.

## Seed Data

Provide seed data for development:
- 1 kepala_guru account
- 5 tentor accounts
- 3 kelas
- 5 mapel
- 1 tahun_ajaran (active)
- Sample siswa (mix of regular and privat)
- Sample wali_murid with links

## Key Relationships for Phase 0

```
profiles (role: kepala_guru)
    │
    ├── manages → profiles (role: tentor)
    ├── manages → profiles (role: siswa)
    │                 ├── has → paket (regular/privat)
    │                 ├── enrolled_in → siswa_kelas (reguler only)
    │                 └── assigned_to → tentor_siswa_privat (privat only)
    ├── manages → profiles (role: wali_murid)
    │                 └── linked_to → wali_siswa (multi-child)
    ├── manages → kelas
    ├── manages → mapel
    ├── manages → tahun_ajaran
    └── assigns → tentor_kelas_mapel
```
