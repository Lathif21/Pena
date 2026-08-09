# Fase 0 — Testing Guide

**Status**: Ready for manual testing  
**Date**: 2026-08-08  
**Dev Server**: http://localhost:5173/

---

## Prerequisite: Create Test Accounts

Before running tests, create accounts for each role. Use the **Kepala Guru Dashboard** to create test users.

### Step 1: Create Kepala Guru Account

Since no accounts exist yet, you must create the first `kepala_guru` account directly in Supabase:

1. Go to **Supabase Dashboard** → Project `splohnebhqwefacqagas`
2. **Authentication → Users** → **Create New User**
3. **Email**: `kg@test.com`  
   **Password**: `TestPass123`  
   **Confirm**: `TestPass123`  
4. Go to **SQL Editor**, run:
   ```sql
   insert into profiles (id, role, nama_lengkap, email, tahun_ajaran_id, created_at)
   select id, 'kepala_guru', 'Kepala Guru Test', email, 
          (select id from tahun_ajaran where is_active = true), now()
   from auth.users where email = 'kg@test.com';
   ```

### Step 2: Login as KG & Create Other Test Accounts

1. Go to http://localhost:5173/login
2. **Email**: `kg@test.com`
3. **Password**: `TestPass123`
4. Should redirect to `/kepala-guru/dashboard`

From KG Dashboard, navigate to **Akun (Accounts)** and create:

#### Tentor Account
- **Path**: `/kepala-guru/akun/tentor` → **Daftarkan Tentor Baru**
- **Nama**: Tentor Satu
- **Email**: `tentor1@test.com`
- **Password**: `TestPass123`
- **Mapel**: Select any (e.g., Matematika)

#### Siswa Regular
- **Path**: `/kepala-guru/akun/siswa` → **Daftarkan Siswa Baru**
- **Nama**: Siswa Regular
- **Email**: `siswa-regular@test.com`
- **Password**: `TestPass123`
- **NIS**: Auto-generate
- **Paket**: Regular
- **Kelas**: Create if doesn't exist (e.g., "Kelas 5A")

#### Siswa Privat
- **Nama**: Siswa Privat
- **Email**: `siswa-privat@test.com`
- **Password**: `TestPass123`
- **Paket**: Privat
- **Tentor**: Select Tentor Satu
- **Mapel**: Select Matematika

#### Wali Murid (Parent)
- **Path**: `/kepala-guru/akun/wali` → **Daftarkan Wali**
- **Nama**: Wali Test
- **Email**: `wali@test.com`
- **Password**: `TestPass123`
- **Link ke Anak**: Select "Siswa Regular" + "Siswa Privat" (multi-select)

---

## Testing Checklist

Use the following checklist to verify Fase 0 functionality. Run each test in order.

### Auth & Role Redirection

- [ ] **Test 1.1**: Login as KG (`kg@test.com`) → Redirects to `/kepala-guru/dashboard`
- [ ] **Test 1.2**: Login as Tentor (`tentor1@test.com`) → Redirects to `/tentor/dashboard`
- [ ] **Test 1.3**: Login as Siswa Regular (`siswa-regular@test.com`) → Redirects to `/siswa/` (placeholder)
- [ ] **Test 1.4**: Login as Wali (`wali@test.com`) → Redirects to `/wali/` (placeholder)
- [ ] **Test 1.5**: Logout → Redirects to `/login`

### Role Access Control (Guards)

- [ ] **Test 2.1**: As Tentor, try to access `/kepala-guru/dashboard` → Should redirect to `/login`
- [ ] **Test 2.2**: As Siswa, try to access `/kepala-guru/akun/tentor` → Should redirect to `/login`
- [ ] **Test 2.3**: As KG, access `/tentor/dashboard` → Should work (KG can use tentor dashboard)
- [ ] **Test 2.4**: As KG, access `/kepala-guru/dashboard` → Should work

### Master Data CRUD

#### Tahun Ajaran (Academic Year)
- [ ] **Test 3.1**: Navigate to `/kepala-guru/master-data/tahun-ajaran`
- [ ] **Test 3.2**: Verify "2025/2026" exists with `is_active = true`
- [ ] **Test 3.3**: Create new tahun ajaran "2026/2027"
- [ ] **Test 3.4**: Click "Set Aktif" on "2026/2027"
- [ ] **Test 3.5**: Verify "2025/2026" shows `is_active = false` and "2026/2027" shows `is_active = true`
- [ ] **Test 3.6**: Delete "2026/2027" (soft-delete)
- [ ] **Test 3.7**: Verify "2026/2027" no longer appears in list (but `deleted_at` is set in DB)

#### Kelas (Classes)
- [ ] **Test 4.1**: Navigate to `/kepala-guru/master-data/kelas`
- [ ] **Test 4.2**: Create Kelas "5A"
- [ ] **Test 4.3**: Create Kelas "5B"
- [ ] **Test 4.4**: Edit "5A" → Change to "5A Advance"
- [ ] **Test 4.5**: Delete "5B" (soft-delete)
- [ ] **Test 4.6**: Verify "5B" no longer shows in list

#### Mapel (Subjects)
- [ ] **Test 5.1**: Navigate to `/kepala-guru/master-data/mapel`
- [ ] **Test 5.2**: Create Mapel "Matematika"
- [ ] **Test 5.3**: Create Mapel "Bahasa Indonesia"
- [ ] **Test 5.4**: Edit "Matematika" → Add description
- [ ] **Test 5.5**: Delete "Bahasa Indonesia" (soft-delete)

### Account Management

#### Tentor CRUD
- [ ] **Test 6.1**: Navigate to `/kepala-guru/akun/tentor`
- [ ] **Test 6.2**: Verify "Tentor Satu" is listed
- [ ] **Test 6.3**: Create another Tentor "Tentor Dua"
- [ ] **Test 6.4**: Verify "Tentor Dua" can login with their email/password
- [ ] **Test 6.5**: Delete "Tentor Dua" (soft-delete)
- [ ] **Test 6.6**: Verify "Tentor Dua" no longer shows (but exists in DB)

#### Siswa CRUD
- [ ] **Test 7.1**: Navigate to `/kepala-guru/akun/siswa`
- [ ] **Test 7.2**: Verify "Siswa Regular" (Paket: Regular, Kelas: 5A)
- [ ] **Test 7.3**: Verify "Siswa Privat" (Paket: Privat, Tentor: Tentor Satu)
- [ ] **Test 7.4**: Create new Siswa Regular "Siswa Regular 2"
- [ ] **Test 7.5**: Verify Siswa Regular 2 can login
- [ ] **Test 7.6**: Delete "Siswa Regular 2"

#### Wali Murid CRUD
- [ ] **Test 8.1**: Navigate to `/kepala-guru/akun/wali`
- [ ] **Test 8.2**: Verify "Wali Test" is linked to both regular & privat siswa
- [ ] **Test 8.3**: Create new Wali "Wali Dua"
- [ ] **Test 8.4**: Link Wali Dua to "Siswa Regular"
- [ ] **Test 8.5**: Verify Wali Dua can login
- [ ] **Test 8.6**: Delete "Wali Dua"

### Assignment

#### Tentor Assignment
- [ ] **Test 9.1**: Navigate to `/kepala-guru/assignment`
- [ ] **Test 9.2**: Assign "Tentor Satu" to "Kelas 5A" + "Matematika"
- [ ] **Test 9.3**: Verify assignment appears in the matrix
- [ ] **Test 9.4**: Delete the assignment (soft-delete)
- [ ] **Test 9.5**: Verify assignment no longer shows

### Soft Delete Verification

- [ ] **Test 10.1**: Open Supabase **SQL Editor**
- [ ] **Test 10.2**: Run:
  ```sql
  select nama, deleted_at from tahun_ajaran where deleted_at is not null;
  select nama, deleted_at from kelas where deleted_at is not null;
  select nama, deleted_at from mapel where deleted_at is not null;
  ```
- [ ] **Test 10.3**: Verify deleted items have `deleted_at` timestamp (not actually deleted)

### Navigation & Placeholders

- [ ] **Test 11.1**: As Tentor, navigate to `/tentor/dashboard` → Shows placeholder
- [ ] **Test 11.2**: As Siswa, navigate to `/siswa/` → Shows placeholder (Phase 1+2)
- [ ] **Test 11.3**: As Wali, navigate to `/wali/` → Shows placeholder (Phase 4)

---

## Expected Results

| Test # | Expected Outcome | Status |
|--------|------------------|--------|
| 1.1 | KG → KG Dashboard | ✅ |
| 1.2 | Tentor → Tentor Dashboard | ✅ |
| 1.3 | Siswa → Siswa Dashboard | ✅ |
| 1.4 | Wali → Wali Dashboard | ✅ |
| 1.5 | Logout → Login | ✅ |
| 2.1 | Access denied to KG routes | ✅ |
| 2.2 | Access denied to KG routes | ✅ |
| 2.3 | KG can access tentor dashboard | ✅ |
| 3.1-3.7 | Tahun ajaran CRUD works | ⏳ |
| 4.1-4.6 | Kelas CRUD works | ⏳ |
| 5.1-5.5 | Mapel CRUD works | ⏳ |
| 6.1-6.6 | Tentor CRUD works | ⏳ |
| 7.1-7.6 | Siswa CRUD works | ⏳ |
| 8.1-8.6 | Wali CRUD works | ⏳ |
| 9.1-9.5 | Assignment works | ⏳ |
| 10.1-10.3 | Soft deletes confirmed | ⏳ |
| 11.1-11.3 | Placeholders load | ⏳ |

---

## Troubleshooting

### Issue: Can't login
**Cause**: Account not created in `profiles` table  
**Fix**: Create account in Supabase dashboard (auth.users) and run SQL insert

### Issue: Redirect loop on login
**Cause**: JWT role claim not set, or role check fails  
**Fix**: Verify `profiles.role` matches expected value (kepala_guru, tentor, siswa, wali_murid)

### Issue: Page shows 500 error
**Cause**: Query or data validation error  
**Fix**: Check browser console (F12) and dev server terminal for stack trace

### Issue: CRUD form doesn't submit
**Cause**: Validation error or database constraint  
**Fix**: Check browser console for error message; verify foreign keys exist (e.g., tahun_ajaran_id)

---

## Notes

- All passwords use format: `TestPass123`
- All test accounts use `@test.com` domain for easy identification
- Soft-delete means `deleted_at` is set, but rows remain in DB
- Only one `tahun_ajaran` may have `is_active = true` at a time (DB enforces)
- Test with real data: create 2-3 of each entity type

---

## After Testing

Once all tests pass:

1. **Update** `fase-0-execution-summary.md` → Mark testing as ✅
2. **Commit** any fixes or seed data
3. **Next Phase**: Begin Phase 1 (Content hierarchy — materi, sub materi, module PDF)
