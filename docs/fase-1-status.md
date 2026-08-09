# Fase 1 — Status & Implementation Checklist

## Completed ✅

### Langkah 1-3: Database & Storage
- ✅ Migrations: `materi` + `sub_materi` tables created
- ✅ Migration: `module` table created
- ✅ Supabase Storage bucket: `modul-pdf` configured (private, PDF-only)
- ✅ Storage policies: KG upload + authenticated read

### Langkah 4-7: API Functions
- ✅ `materi.ts`: listMateri, createMateri, updateMateri, softDeleteMateri
- ✅ `sub-materi.ts`: listSubMateri, createSubMateri, updateSubMateri, softDeleteSubMateri
- ✅ `module.ts`: getModuleBySubMateri, uploadModule, publishModule, replaceModule, getSignedUrl

### Langkah 8: Materi Management UI
- ✅ `MateriFull.svelte`: Materi table with create/edit/delete
- ✅ `MateriForm.svelte`: Create/edit form (design-system compliant)
- ✅ `+page.svelte`: Materi list page
- ✅ `+page.server.ts`: Load mapel data + create/update actions
- ✅ Design system: Cards, buttons, typography, colors applied

## Partially Done 🟡

### Langkah 9: Sub Materi UI
- ✅ `SubMateriTable.svelte`: Table component created
- ✅ `SubMateriForm.svelte`: Form component created
- ⏳ Routes & page files: NOT YET
- ⏳ Server actions: NOT YET

### Langkah 10: Module Upload & Publish UI
- ✅ API functions complete
- ⏳ Page component: NOT YET
- ⏳ PDF viewer: NOT YET
- ⏳ Upload/publish forms: NOT YET

## Not Started ⏹️

### Langkah 11: Siswa Module Viewing (MVP)
- Query to build siswa module list (published only)
- PDF viewer page + signed URL handling
- Breadcrumb navigation

### Langkah 12: Tentor Module Viewing
- Tentor scope filter (via tentor_kelas_mapel or tentor_siswa_privat)
- Reuse siswa module viewer

### Langkah 13: Search Materi
- Client-side filter on materi list

---

## Quick Setup to Test What's Done

### 1. Push migrations (already done)
```bash
supabase db push
```

### 2. Create test Mapel (via Supabase dashboard or API)
- In `mapel` table: insert a row with nama="Matematika"
- Note the `mapel_id`

### 3. Visit Materi page
- URL: `/kepala-guru/konten/[mapel_id]/materi`
- Should load empty table + "Tambah Materi" button

### 4. Test CRUD
- Click "Tambah Materi"
- Create: Nama="Bab 1", Nomor Urut="1"
- Create: Nama="Bab 2", Nomor Urut="2"
- Verify order (should be 1 → 2)
- Edit Bab 1 → change nomor_urut to "3" → verify order flips
- Delete Bab 2 → verify gone

---

## To Complete Phase 1 (Remaining Work)

### Must Do ✋

1. **Sub Materi Routes**
   - Create folder: `src/routes/(kepala-guru)/konten/[mapelId]/materi/[materiId]/`
   - Create `+page.svelte` + `+page.server.ts` (create/update actions)
   - Link from materi table: `<a href="materi/{id}">` → sub materi page

2. **Module Page** (upload + publish)
   - Create folder: `src/routes/(kepala-guru)/konten/[mapelId]/materi/[materiId]/[subMateriId]/module/`
   - Component: `ModulePage.svelte` (show status + upload/publish buttons)
   - Form: file input + drag-drop (use `<input type="file" accept="application/pdf">`)
   - On success: show PDF viewer via `<iframe src="[signedUrl]">`
   - Design: status badge (draft/published), button states

3. **Siswa Module List** (published only)
   - Route: `(siswa)/mapel/[mapelId]`
   - Load data: query published modules per mapel
   - Filter logic:
     ```
     - Materi visible if (deleted_at is null) AND (has sub_materi with published module)
     - Sub materi visible if (deleted_at is null) AND (has published module)
     ```
   - Link: click sub materi → module viewer

4. **PDF Viewer** (signed URL + iframe)
   - `getSignedUrl()` already in module.ts
   - Render: `<iframe src={signedUrl} class="w-full h-full"/>`
   - On siswa route: lock view (no download button, print only)

### Nice to Have (Can Defer) 🎯

- Tentor module list (copy siswa list + add mapel filter)
- Search client-side (filter materi by nama)
- Breadcrumb navigation
- Drag-drop file upload UI

---

## Design System Applied ✨

- Cards: `rounded-2xl border border-gray-200 bg-white p-6`
- Primary button: `bg-primary text-white rounded-lg hover:bg-primary-hover`
- Tables: thin borders `border-gray-100`, hover `bg-gray-50`
- Status badges: pill with tinted background
- Typography: headings `text-2xl font-bold`, body `text-sm`

**TODO:** Configure Tailwind theme with primary/success/warning/danger colors (currently relying on Tailwind defaults).

---

## Next Commands

```bash
# After module pages created + tested:

# Run integration tests
npm run test:e2e

# Build for staging
npm run build
```

---

## Estimate to Completion

- Sub Materi routes: ~1 hour (copy-paste materi pattern)
- Module page + PDF viewer: ~2 hours (form + file upload handling)
- Siswa module list: ~1 hour (query filter + breadcrumb)
- Testing all flows: ~1 hour
- **Total: ~5 hours** (1 full dev session)

---

## Assumptions Baked In

1. **No publish state validation in UI yet** — assumes KG clicks "Publish" once, intentionally
2. **No soft-delete recovery** — deleted items stay deleted (no restore button)
3. **No PDF preview thumbnail** — just file name + status
4. **No file size/type validation in UI** — relies on Supabase storage policy
5. **Search is client-side** — no full-text index in DB

All fine for MVP. Upgrade paths are straightforward.

