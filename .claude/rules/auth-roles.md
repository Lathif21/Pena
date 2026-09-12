---
paths:
  - "**/features/auth/**"
  - "**/routes/auth/**"
  - "**/routes/kepala-guru/**"
  - "**/routes/tentor/**"
  - "**/routes/siswa/**"
  - "**/routes/wali/**"
  - "supabase/migrations/**"
---

# Auth & Roles

## Four Roles

| Role | Dashboard | Can also access |
|---|---|---|
| `kepala_guru` | Dashboard KG | Dashboard Tentor (via navigation switch) |
| `tentor` | Dashboard Tentor | — |
| `siswa` | Dashboard Siswa | — |
| `wali_murid` | Dashboard Wali | — |

Role is stored in `profiles.role` and included in the JWT via a custom access token hook. All route guards check the JWT claim, never a client-side variable.

## Kepala Guru Dual Dashboard

On login, `kepala_guru` sees a choice: Dashboard Kepala Guru or Dashboard Tentor. This is a navigation switch, not a role switch — the JWT still says `kepala_guru` in both views.

When using Dashboard Tentor, `kepala_guru` behaves identically to a `tentor`: same features, same data access for their assigned classes. The tentor route group must accept both `tentor` and `kepala_guru` role claims.

## Folder Route Per Peran

```
routes/
├── auth/           Login, logout, password reset
├── kepala-guru/    KG dashboard — admin, content, monitoring
├── tentor/         Tentor dashboard — teaching workflow
├── siswa/          Student dashboard — learning
└── wali/           Parent dashboard — read-only monitoring
```

Each folder's `+layout.server.ts` guards the whole folder by checking the role claim from the JWT. A page-level guard means the folder split is wrong.

The `tentor/` folder accepts role `tentor` OR `kepala_guru`. No other folder has dual-role access.

## Auth Flow

Use Supabase Auth with email + password. No social login, no magic link.

1. `kepala_guru` creates all accounts — no self-registration for any role
2. On signup, system creates a row in `profiles` with `role`, `tahun_ajaran_id` (active year)
3. On login, custom access token hook injects `role` into the JWT

## Account Creation Must Use Admin API, Never Client signUp

Because `kepala_guru` creates accounts on behalf of other people, account creation must go through `supabase.auth.admin.createUser()` with `email_confirm: true`, called from a server action (`+page.server.ts`), never `supabase.auth.signUp()` from the browser.

Reasons:
- `signUp()` triggers a confirmation email by default. Supabase's built-in email service has a very low rate limit (a handful of emails per hour on free tier) — a few accounts created in quick succession will hit it.
- Nobody in this product self-registers, so there is no legitimate reason to send a confirmation email at all.
- `email_confirm: true` marks the user as confirmed immediately, skipping email delivery entirely.

The admin client requires the `service_role` key:

```typescript
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
```

**The `service_role` key bypasses RLS entirely and must never reach the browser.** Store it as `SUPABASE_SERVICE_ROLE_KEY` (no `PUBLIC_` prefix) so SvelteKit keeps it server-only. Only call `supabaseAdmin` from `+page.server.ts` or `+server.ts` files, never from `.svelte` components or client-side `.ts` files under `features/*/components/`.

## Profiles Table

```sql
create table profiles (
  id uuid primary key references auth.users(id),
  role text not null check (role in ('kepala_guru', 'tentor', 'siswa', 'wali_murid')),
  nama_lengkap text not null,
  email text not null,
  tahun_ajaran_id uuid not null references tahun_ajaran(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

## Password Policy

Minimum 8 characters. No complexity requirements — this is a bimbel, not a bank. `kepala_guru` can reset any user's password.

## Session

Supabase handles session with JWT. Token refresh is automatic via the Supabase client. No custom session logic.

## First Kepala Guru Account

There is no self-registration, which creates a bootstrapping problem: the very first `kepala_guru` account cannot be created through the app. Create it manually once via Supabase Dashboard → Authentication → Add User, then insert a matching row into `profiles` with `role = 'kepala_guru'`. This is a one-time setup step, not a feature to build.
