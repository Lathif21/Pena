# Fase 0 — Runtutan Eksekusi

Panduan langkah demi langkah untuk membangun fondasi Pena.
Jalankan berurutan — setiap langkah bergantung pada langkah sebelumnya.

> **Terminal: PowerShell.** Semua command di panduan ini ditulis untuk PowerShell (default Windows). Command seperti `npx`, `npm`, `supabase` adalah tool CLI biasa dan jalan sama persis di terminal mana pun — yang beda hanya command pembuatan folder (`New-Item` di PowerShell vs `mkdir -p` di Bash). Jangan campur dua gaya sintaks di sesi terminal yang sama.

---

## Langkah 1 — Setup Project SvelteKit

```bash
# Buat project SvelteKit
npx sv create pena_web
# Pilih: Skeleton project, TypeScript, ESLint, Prettier

# Masuk ke project
cd pena_web

# Install Tailwind CSS
npx sv add tailwindcss

# Install Supabase client
npm install @supabase/supabase-js @supabase/ssr

# Install dependency tambahan
npm install zod              # validasi form
```

## Langkah 2 — Setup Supabase

```bash
# Install Supabase CLI (jika belum)
npm install -g supabase

# Init Supabase di root project (bukan di pena_web)
cd ..
supabase init

# Buat project di Supabase Dashboard (https://supabase.com/dashboard)
# Catat: PROJECT_URL dan ANON_KEY
```

Buat file environment:

```bash
# pena_web/.env
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
```

## Langkah 3 — Buat Struktur Folder

> Seluruh panduan ini ditulis untuk **PowerShell** (terminal default Windows). Jangan campur dengan sintaks Bash (`mkdir -p`, `{a,b}`) — itu sumber error sebelumnya.

```powershell
cd pena_web

# Feature folders
New-Item -ItemType Directory -Force -Path "src/features/auth/components"
New-Item -ItemType Directory -Force -Path "src/features/auth/data"
New-Item -ItemType Directory -Force -Path "src/features/account/components"
New-Item -ItemType Directory -Force -Path "src/features/account/data"
New-Item -ItemType Directory -Force -Path "src/features/master-data/components"
New-Item -ItemType Directory -Force -Path "src/features/master-data/data"
New-Item -ItemType Directory -Force -Path "src/features/assignment/components"
New-Item -ItemType Directory -Force -Path "src/features/assignment/data"

# Lib folders
New-Item -ItemType Directory -Force -Path "src/lib/supabase"
New-Item -ItemType Directory -Force -Path "src/lib/components"
New-Item -ItemType Directory -Force -Path "src/lib/stores"
New-Item -ItemType Directory -Force -Path "src/lib/utils"

# Route groups — tanda kurung aman dalam tanda kutip, tidak perlu di-escape
New-Item -ItemType Directory -Force -Path "src/routes/auth/login"
New-Item -ItemType Directory -Force -Path "src/routes/auth/logout"
New-Item -ItemType Directory -Force -Path "src/routes/kepala-guru/akun/tentor"
New-Item -ItemType Directory -Force -Path "src/routes/kepala-guru/akun/siswa"
New-Item -ItemType Directory -Force -Path "src/routes/kepala-guru/akun/wali"
New-Item -ItemType Directory -Force -Path "src/routes/kepala-guru/master-data/kelas"
New-Item -ItemType Directory -Force -Path "src/routes/kepala-guru/master-data/mapel"
New-Item -ItemType Directory -Force -Path "src/routes/kepala-guru/master-data/tahun-ajaran"
New-Item -ItemType Directory -Force -Path "src/routes/kepala-guru/assignment"

# Placeholder folders untuk fase selanjutnya
New-Item -ItemType Directory -Force -Path "src/routes/tentor/dashboard"
New-Item -ItemType Directory -Force -Path "src/routes/siswa"
New-Item -ItemType Directory -Force -Path "src/routes/wali"
```

Verifikasi hasil:

```powershell
Get-ChildItem -Recurse -Directory src | Select-Object FullName
```

## Langkah 4 — Setup Supabase Client

Buat file `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

export const supabase = createBrowserClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
)
```

Buat file `src/lib/supabase/server.ts` untuk server-side:

```typescript
import { createServerClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { Cookies } from '@sveltejs/kit'

export function createSupabaseServerClient(cookies: Cookies) {
  return createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookies.set(name, value, { ...options, path: '/' })
          })
        }
      }
    }
  )
}
```

## Langkah 5 — Database Migration: Tahun Ajaran

```bash
supabase migration new create_tahun_ajaran
```

Isi migration:

```sql
create table tahun_ajaran (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Hanya satu tahun ajaran aktif
create unique index idx_tahun_ajaran_active
  on tahun_ajaran (is_active) where is_active = true and deleted_at is null;

-- Seed tahun ajaran pertama
insert into tahun_ajaran (nama, is_active) values ('2025/2026', true);
```

## Langkah 6 — Database Migration: Profiles & Roles

```bash
supabase migration new create_profiles
```

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('kepala_guru', 'tentor', 'siswa', 'wali_murid')),
  nama_lengkap text not null,
  email text not null,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_profiles_role on profiles(role) where deleted_at is null;
create index idx_profiles_tahun_ajaran on profiles(tahun_ajaran_id);
```

## Langkah 7 — Database Migration: Master Data

```bash
supabase migration new create_master_data
```

```sql
-- Kelas
create table kelas (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Mata Pelajaran
create table mapel (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

## Langkah 8 — Database Migration: Siswa (Paket & Assignment)

```bash
supabase migration new create_siswa_structure
```

```sql
-- Extend profiles untuk siswa
create table siswa_detail (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id),
  nis text not null unique,
  paket text not null check (paket in ('regular', 'privat')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_siswa_detail_profile on siswa_detail(profile_id);
create index idx_siswa_detail_paket on siswa_detail(paket) where deleted_at is null;

-- Siswa reguler → kelas
create table siswa_kelas (
  id uuid primary key default gen_random_uuid(),
  siswa_detail_id uuid not null references siswa_detail(id),
  kelas_id uuid not null references kelas(id),
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (siswa_detail_id, kelas_id, tahun_ajaran_id)
);

create index idx_siswa_kelas_kelas on siswa_kelas(kelas_id);
create index idx_siswa_kelas_tahun on siswa_kelas(tahun_ajaran_id);

-- Tentor → kelas + mapel
create table tentor_kelas_mapel (
  id uuid primary key default gen_random_uuid(),
  tentor_id uuid not null references profiles(id),
  kelas_id uuid not null references kelas(id),
  mapel_id uuid not null references mapel(id),
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tentor_id, kelas_id, mapel_id, tahun_ajaran_id)
);

create index idx_tkm_tentor on tentor_kelas_mapel(tentor_id);
create index idx_tkm_kelas on tentor_kelas_mapel(kelas_id);
create index idx_tkm_mapel on tentor_kelas_mapel(mapel_id);

-- Siswa privat → tentor + mapel (tanpa kelas)
create table tentor_siswa_privat (
  id uuid primary key default gen_random_uuid(),
  siswa_detail_id uuid not null references siswa_detail(id),
  tentor_id uuid not null references profiles(id),
  mapel_id uuid not null references mapel(id),
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (siswa_detail_id, tentor_id, mapel_id, tahun_ajaran_id)
);

create index idx_tsp_siswa on tentor_siswa_privat(siswa_detail_id);
create index idx_tsp_tentor on tentor_siswa_privat(tentor_id);

-- Wali → siswa (multi-anak)
create table wali_siswa (
  id uuid primary key default gen_random_uuid(),
  wali_id uuid not null references profiles(id),
  siswa_detail_id uuid not null references siswa_detail(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (wali_id, siswa_detail_id)
);

create index idx_wali_siswa_wali on wali_siswa(wali_id);
create index idx_wali_siswa_siswa on wali_siswa(siswa_detail_id);
```

## Langkah 9 — Push Migration & Seed

```bash
# Push ke Supabase
supabase db push

# Atau jika pakai local development
supabase start
supabase db reset  # reset + jalankan semua migration
```

Buat seed di `supabase/seed.sql`:

```sql
-- Seed akan dibuat setelah migration berhasil
-- Isi: 1 KG, 5 tentor, sample siswa, sample wali
```

## Langkah 10 — Route Guards

Buat `src/routes/kepala-guru/+layout.server.ts`:

```typescript
import { redirect } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies }) {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw redirect(303, '/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, nama_lengkap')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (profile?.role !== 'kepala_guru') throw redirect(303, '/login')

  return { user, profile }
}
```

Buat hal serupa untuk route group lain sesuai aturan di `auth-roles.md`.

## Langkah 11 — Halaman Login

Buat `src/routes/auth/login/+page.svelte` — form email + password, submit ke Supabase Auth, redirect berdasarkan role:

- `kepala_guru` → `/kepala-guru/akun` (atau pilihan dashboard)
- `tentor` → `/tentor/dashboard`
- `siswa` → `/siswa/mapel`
- `wali_murid` → `/wali/anak`

## Langkah 12 — CRUD Kelas & Mapel

Bangun di urutan ini:

1. `features/master-data/` — API functions (list, create, update, soft-delete)
2. `routes/kepala-guru/master-data/kelas/` — tabel + form
3. `routes/kepala-guru/master-data/mapel/` — tabel + form
4. `routes/kepala-guru/master-data/tahun-ajaran/` — tabel + set active

## Langkah 13 — CRUD Akun Tentor

1. `features/account/` — API functions
2. `routes/kepala-guru/akun/tentor/` — tabel + form (nama, email, password)
3. Saat buat tentor: create auth user + insert profiles row

## Langkah 14 — CRUD Akun Siswa

1. `routes/kepala-guru/akun/siswa/` — tabel + form
2. Form siswa: nama, email, password, **pilih paket** (regular/privat)
3. Jika regular: pilih kelas → insert `siswa_kelas`
4. Jika privat: pilih tentor + mapel (bisa multi) → insert `tentor_siswa_privat`
5. NIS auto-generate atau input manual

## Langkah 15 — CRUD Akun Wali Murid

1. `routes/kepala-guru/akun/wali/` — tabel + form
2. Form wali: nama, email, password, **link ke anak** (multi-select dari daftar siswa)
3. Insert `wali_siswa` per anak yang dipilih

## Langkah 16 — Assignment Tentor

1. `routes/kepala-guru/assignment/` — UI untuk assign tentor ke kelas + mapel
2. Insert `tentor_kelas_mapel`
3. Tampilkan matrix: tentor × kelas × mapel

## Langkah 17 — Pilihan Dashboard KG

1. Buat halaman pilihan setelah KG login: "Dashboard Kepala Guru" atau "Dashboard Tentor"
2. Dashboard Tentor untuk KG — placeholder halaman kosong (fitur dibangun di Fase 3)

## Langkah 18 — Testing & Validasi

```bash
# Jalankan dev server
npm run dev

# Test checklist:
# [ ] Login sebagai kepala_guru → masuk ke pilihan dashboard
# [ ] Login sebagai tentor → masuk ke dashboard tentor (placeholder)
# [ ] Login sebagai siswa → masuk ke dashboard siswa (placeholder)
# [ ] Login sebagai wali → masuk ke dashboard wali (placeholder)
# [ ] Role guard: tentor tidak bisa akses route kepala-guru
# [ ] KG bisa CRUD kelas
# [ ] KG bisa CRUD mapel
# [ ] KG bisa buat/set tahun ajaran aktif
# [ ] KG bisa daftarkan tentor
# [ ] KG bisa daftarkan siswa regular (assign ke kelas)
# [ ] KG bisa daftarkan siswa privat (assign ke tentor + mapel)
# [ ] KG bisa daftarkan wali (link ke anak)
# [ ] KG bisa assign tentor ke kelas + mapel
# [ ] Soft-delete bekerja (data tidak hilang, cuma tidak muncul)
# [ ] Tahun ajaran aktif hanya satu
```

---

## Urutan Prioritas Jika Terbatas Waktu

Jika perlu memotong, kerjakan berurutan dan berhenti di mana pun:

1. Langkah 1-6 (setup + database) — **wajib**
2. Langkah 10-11 (auth + login) — **wajib**
3. Langkah 12 (kelas + mapel) — **wajib**, dibutuhkan langkah selanjutnya
4. Langkah 13 (tentor) — **wajib**
5. Langkah 14 (siswa + paket) — **wajib**
6. Langkah 15 (wali) — bisa ditunda ke awal Fase 4
7. Langkah 16 (assignment matrix) — bisa disederhanakan ke form biasa
8. Langkah 17 (pilihan dashboard KG) — bisa pakai redirect sederhana dulu
