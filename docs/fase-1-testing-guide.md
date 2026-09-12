# Fase 1 — Testing Guide

Complete test checklist for content hierarchy (materi → sub materi → module → student viewing).

## Pre-Test Setup

**Accounts needed:**
- 1 Kepala Guru account
- 1 Tentor account
- 2+ Siswa accounts (different paket: regular + privat)
- 1 Mapel with 1+ kelas

**Test in this order:**
1. Materi CRUD (Langkah 8)
2. Sub Materi CRUD (Langkah 9)
3. Module upload & publish (Langkah 10)
4. Student module viewing (Langkah 11)

---

## Test Set 1: Materi CRUD

**Route:** `/kepala-guru/konten/[mapelId]/materi`

**Navigation:** 
1. Go to `/kepala-guru/dashboard`
2. Click "📖 Materi & Modul" button
3. Select a mapel from the grid
4. You'll be on `/kepala-guru/konten/[mapelId]/materi`

### TC-1.1: Create Materi

**Steps:**
1. Login as Kepala Guru
2. Navigate to `/kepala-guru/konten/` (shows grid of mapels)
3. Click on a mapel card → goes to materi list page
4. Click "Tambah Materi"
4. Fill form:
   - Nama: "Bab 1 Pengenalan"
   - Nomor Urut: "1"
5. Click "Simpan"

**Expected:**
- Form closes
- Materi appears in table, ordered by nomor_urut
- UI shows: Urutan | Nama | Aksi (Edit / Hapus)

### TC-1.2: Edit Materi

**Steps:**
1. In materi list, click "Edit" on any materi
2. Change nama to "Bab 1 Pendahuluan" + nomor_urut to "2"
3. Click "Simpan"

**Expected:**
- Materi updates in table
- Order changes based on nomor_urut

### TC-1.3: Delete Materi (Soft Delete)

**Steps:**
1. Click "Hapus" on a materi
2. Confirm deletion

**Expected:**
- Materi disappears from list (soft-deleted in DB)
- Verify in Supabase: `deleted_at` is set

### TC-1.4: Materi Visibility

**Steps:**
1. Create 3 materi with nomor_urut: 1, 2, 3
2. Verify they appear in order 1→2→3

**Expected:**
- List always ordered by nomor_urut ascending

### TC-1.5: Error Handling

**Steps:**
1. Try to create materi without nama → error
2. Try to create materi without nomor_urut → error

**Expected:**
- Form shows error message (red banner)

---

## Test Set 2: Sub Materi CRUD

**Route:** `kepala-guru/konten/[mapelId]/materi/[materiId]`

*(Once routes are created, same test structure as Set 1)*

### TC-2.1 through TC-2.5: Parallel to Materi tests

- Create sub materi under a materi
- Edit sub materi
- Delete sub materi (soft-delete)
- Verify ordering by nomor_urut
- Error handling (missing fields)

**Expected:** All behaviors identical to materi

---

## Test Set 3: Module Upload & Publish

**Route:** `kepala-guru/konten/.../sub-materi/[subMateriId]/module`

### TC-3.1: Upload PDF (Create Draft Module)

**Steps:**
1. Navigate to a sub materi → "Upload Module"
2. Select a PDF file (test with valid PDF + invalid file types)
3. Click "Simpan"

**Expected:**
- File uploads to Supabase Storage `modul-pdf/` bucket
- Record created in `module` table with status='draft'
- UI shows: "Status: Draft" + "Ganti File" button + "Publish" button

### TC-3.2: View PDF Viewer (Draft Status)

**Steps:**
1. On module page, view PDF via `<iframe>` with signed URL

**Expected:**
- PDF displays in browser PDF viewer
- No errors about access denied

### TC-3.3: Replace PDF (While Draft)

**Steps:**
1. Click "Ganti File" → select new PDF
2. Click "Simpan"

**Expected:**
- Old file deleted from storage
- New file uploaded
- Record stays same, storage_path updated

### TC-3.4: Publish Module

**Steps:**
1. Click "Publish" button
2. Confirm publication dialog

**Expected:**
- status changes to 'published'
- published_at timestamp set
- UI changes to: "Terkunci — dipublish [date]"
- "Ganti File" and "Publish" buttons disappear

### TC-3.5: Cannot Edit Published Module

**Steps:**
1. Try to click "Ganti File" on a published module

**Expected:**
- Button disabled or hidden
- Error if user attempts direct API call

### TC-3.6: File Type Validation

**Steps:**
1. Try to upload .txt, .doc, .jpg (non-PDF)

**Expected:**
- Upload rejected at storage policy level
- Error shown to user

---

## Test Set 4: Student Module Viewing (MVP)

**Route:** `siswa/mapel/[mapelId]`

### TC-4.1: Siswa Sees Only Published Content

**Precondition:**
- Materi 1: has sub_materi_1 + sub_materi_2
  - sub_materi_1: module (draft) ← NOT visible
  - sub_materi_2: module (published) ← VISIBLE
- Materi 2: has sub_materi_3
  - sub_materi_3: no module ← NOT visible

**Steps:**
1. Login as Siswa
2. Navigate to Mapel → this mapel
3. View content list

**Expected:**
- Only Materi 1 appears (has ≥1 published module)
- Inside Materi 1: only sub_materi_2 appears
- Materi 2 is hidden (no published modules)
- Click sub_materi_2 → PDF viewer loads

### TC-4.2: Siswa Cannot Access Draft Modules

**Steps:**
1. Try direct URL: `/siswa/mapel/[mapelId]/materi/[materiId]/sub-materi/[subMateriId-with-draft]/module`

**Expected:**
- Access denied or module not found
- Or: module list doesn't show draft modules

### TC-4.3: Search Materi (Client-side Filter)

**Steps:**
1. On `/siswa/mapel/[mapelId]`, type in search box: "Pengenalan"
2. Clear search

**Expected:**
- List filters as you type (client-side, instant)
- Shows only matching materi

---

## Test Set 5: Tentor Module Viewing

**Route:** `tentor/modul`

### TC-5.1: Tentor Sees Only Their Mapel

**Precondition:**
- Tentor A: teaches Mapel X
- Tentor B: teaches Mapel Y

**Steps:**
1. Login as Tentor A
2. Navigate to "Modul" menu

**Expected:**
- Only published modules from Mapel X
- Mapel Y not shown

### TC-5.2: Tentor Cannot See Draft Modules

**Steps:**
- Same as TC-4.2 (draft modules hidden)

**Expected:**
- Draft modules filtered out

---

## Test Set 6: Content Visibility Rules

**Database assertions** (Supabase Console):

### TC-6.1: Soft Delete Chain

**Steps:**
1. Create: Materi → Sub Materi → Module (published)
2. Delete materi
3. Query: `select * from materi where id='...' and deleted_at is null`

**Expected:**
- materi.deleted_at is set
- sub_materi and module records still exist (not cascade-deleted)
- Sub materi still queryable (just with deleted parent)

### TC-6.2: Unique Constraint on (materi_id, nomor_urut)

**Steps:**
1. Create sub_materi_1 under materi_1 with nomor_urut=1
2. Try to create sub_materi_2 under materi_1 with nomor_urut=1

**Expected:**
- Error: unique constraint violation
- Can use same nomor_urut under a different materi

### TC-6.3: Module Has One Sub Materi

**Steps:**
1. Try to create 2 modules for the same sub_materi

**Expected:**
- Error: unique constraint on (sub_materi_id)

---

## Test Set 7: Error Paths

### TC-7.1: Network Errors

**Steps:**
1. Slow down network (DevTools → Network tab → slow 3G)
2. Try to upload large PDF

**Expected:**
- Timeout or error message
- No partial data in DB

### TC-7.2: Concurrent Edits

**Steps:**
1. Open materi edit in 2 browser tabs
2. Edit nama in tab A, save
3. Edit nomor_urut in tab B, save

**Expected:**
- Tab B's edit overwrites Tab A's (last-write-wins)
- OR: Tab B shows stale data on refresh

---

## Cleanup After Testing

```sql
-- Delete test data (only for local testing, never production)
delete from module where storage_path like '%test%';
delete from sub_materi where materi_id in (select id from materi where deleted_at is not null);
delete from materi where deleted_at is not null;
```

---

## Sign-Off

- [ ] TC-1.1 through TC-1.5: Materi CRUD works
- [ ] TC-2.1 through TC-2.5: Sub Materi CRUD works
- [ ] TC-3.1 through TC-3.6: Module lifecycle (draft → publish) works
- [ ] TC-4.1 through TC-4.3: Siswa sees published content only
- [ ] TC-5.1 through TC-5.2: Tentor scoped to their mapel
- [ ] TC-6.1 through TC-6.3: Database constraints enforced
- [ ] TC-7.1 through TC-7.2: Error handling solid
