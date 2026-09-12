---
paths:
  - "pena_web/**"
---

# SvelteKit Structure

Feature-first. Everything about one feature lives in one folder.

```
src/
├── lib/
│   ├── supabase/        client init, typed queries
│   ├── components/      generic UI (buttons, modals, badges, charts)
│   ├── stores/          global state (auth, active tahun_ajaran)
│   └── utils/           formatters, validators, constants
├── features/
│   ├── auth/            login, session management
│   ├── account/         CRUD tentor, siswa, wali — used by KG
│   ├── master-data/     kelas, mapel, tahun_ajaran
│   ├── assignment/      tentor→kelas+mapel, siswa→kelas, privat→tentor+mapel, wali→siswa
│   ├── module/          (Phase 1) materi, sub_materi, PDF upload
│   ├── question/        (Phase 2) latihan soal, try out, auto-grade
│   ├── grading/         (Phase 2) manual grade input, grade display
│   ├── attendance/      (Phase 3) tentor photo, student checklist
│   ├── journal/         (Phase 3) jurnal mengajar
│   ├── session/         (Phase 3) selesai mengajar
│   ├── relief/          (Phase 4) relief person
│   ├── parent/          (Phase 4) wali dashboard, progress charts
│   ├── kpi/             (Phase 5) KPI computation, config
│   └── export/          (Phase 5) PDF export
└── routes/
    ├── auth/
    │   ├── login/
    │   └── logout/
    ├── kepala-guru/
    │   ├── overview/        dashboard ringkasan harian (Phase 5)
    │   ├── akun/            CRUD tentor, siswa, wali
    │   ├── master-data/     kelas, mapel, tahun_ajaran
    │   ├── assignment/      assign tentor, siswa, wali
    │   ├── konten/          (Phase 1) materi, sub_materi, module, soal
    │   ├── monitoring/      presensi, jurnal, sesi, nilai
    │   ├── kpi/             (Phase 5)
    │   └── export/          (Phase 5)
    ├── tentor/
    │   ├── dashboard/
    │   ├── presensi/        (Phase 3)
    │   ├── nilai/           (Phase 2)
    │   ├── jurnal/          (Phase 3)
    │   ├── modul/           (Phase 1) view only
    │   └── relief/          (Phase 4)
    ├── siswa/
    │   ├── mapel/           (Phase 1+2)
    │   └── nilai/           (Phase 2)
    └── wali/
        ├── anak/            (Phase 4)
        └── progress/        (Phase 4)
```

## Guard Per Folder Route

Each folder's `+layout.server.ts` checks the JWT role claim:
- `kepala-guru` → `role === 'kepala_guru'`
- `tentor` → `role === 'tentor' || role === 'kepala_guru'`
- `siswa` → `role === 'siswa'`
- `wali` → `role === 'wali_murid'`

One guard per folder, not per page.

Route memakai folder biasa (`tentor/`, `siswa/`, `wali/`, `kepala-guru/`),
bukan route group berkurung. Route group menghilangkan segmennya dari URL —
`(tentor)/dashboard` menghasilkan `/dashboard`, bukan `/tentor/dashboard` —
dan itu akan memutus semua link, redirect login, serta path di testing guide.

## Rules

- A feature never imports another feature's internals. Shared needs go to `lib/`.
- `lib/components/` holds only generic UI. A component naming `mapel` or `materi` belongs in `features/`.
- Data fetching in `+page.server.ts` and `features/<feature>/api.ts`, never inline in components.
- Components over 150 lines get split.
- Keep it light — this is a CRUD dashboard. Reach for a library only when the plain solution has failed.
- Use Tailwind utility classes. No custom CSS files unless Tailwind cannot express it.

## Naming

Files: `kebab-case`. Components: `PascalCase.svelte`. Types: `PascalCase`.

Use Indonesian domain terms as defined in CLAUDE.md vocabulary — `MapelList.svelte`, `TentorForm.svelte`, `PaketBadge.svelte`.

## Phase 0 Scope

Only build these routes and features now:
- `auth/` — login, logout
- `kepala-guru/akun/` — CRUD tentor, siswa (with paket), wali
- `kepala-guru/master-data/` — kelas, mapel, tahun_ajaran
- `kepala-guru/assignment/` — all assignment types
- `features/auth/`
- `features/account/`
- `features/master-data/`
- `features/assignment/`

Everything else is scaffolded as empty folders with a README noting the target phase.
