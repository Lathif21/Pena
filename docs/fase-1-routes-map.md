# Fase 1 — Routes & Navigation Map

Content hierarchy flows for Kepala Guru (KG), Siswa, and Tentor.

## Kepala Guru: Content Management

```
/kepala-guru/dashboard
  ↓ Click "Materi & Modul"
  
/kepala-guru/konten
  ├── List all mapels (grid view)
  │
  └── /[mapelId]/materi
        ├── List all materi for this mapel
        ├── Create/Edit/Delete materi
        │
        └── /[materiId]
              ├── List all sub_materi under this materi
              ├── Create/Edit/Delete sub_materi
              │
              └── /[subMateriId]/module
                    ├── Upload PDF (create draft module)
                    ├── Publish module
                    ├── Replace PDF (if draft)
                    └── View PDF (signed URL in iframe)
```

### Route Details

| Route | Component | Data Loaded | Actions |
|-------|-----------|-------------|---------|
| `/kepala-guru/konten/[mapelId]/materi` | `MateriFull.svelte` | Mapel name + materi list | create/update/delete materi |
| `/kepala-guru/konten/[mapelId]/materi/[materiId]` | `SubMateriTable.svelte` | Materi name + sub_materi list | create/update/delete sub_materi |
| `/kepala-guru/konten/.../[subMateriId]/module` | `ModulePage.svelte` | Module data + storage_path | upload/publish/replace module |

### Server Actions

**`+page.server.ts` files (one per route):**

```
materi/+page.server.ts
  ├── load()     → fetch mapel + materi list
  ├── ?/create  → insert materi
  └── ?/update  → update materi

materi/[materiId]/+page.server.ts
  ├── load()     → fetch materi + sub_materi list
  ├── ?/create  → insert sub_materi
  └── ?/update  → update sub_materi

materi/[materiId]/[subMateriId]/module/+page.server.ts
  ├── load()     → fetch module + signed URL
  ├── ?/upload  → upload file to storage + create/update module (draft)
  └── ?/publish → set status='published', published_at=now()
```

---

## Siswa: Module Viewing (MVP)

```
siswa/mapel
  ├── [mapelId]
        └── List of published materi for this mapel
              ├── Filter: materi.deleted_at is null
              ├── AND: has sub_materi with published module
              │
              └── [materiId]
                    └── List of published sub_materi under this materi
                          ├── Filter: sub_materi.deleted_at is null
                          ├── AND: has published module
                          │
                          └── [subMateriId]/module
                                └── PDF Viewer
                                      └── Display via <iframe src={signedUrl}>
```

### Route Details

| Route | Component | Data Loaded | Logic |
|-------|-----------|-------------|-------|
| `siswa/mapel/[mapelId]` | SiswaMateriList | Mapel name + published materi list | Filter by published modules |
| `siswa/mapel/[mapelId]/[materiId]` | SiswaSubMateriList | Materi name + published sub_materi list | Filter by published modules |
| `siswa/mapel/[mapelId]/[materiId]/[subMateriId]/module` | PdfViewer | Module + signedUrl | Render iframe with PDF |

### Data Load Pattern

```typescript
// Pseudocode: lisibile materi for siswa
SELECT m.* FROM materi m
WHERE m.mapel_id = ? 
  AND m.deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM sub_materi sm
    JOIN module mod ON sm.id = mod.sub_materi_id
    WHERE sm.materi_id = m.id
      AND sm.deleted_at IS NULL
      AND mod.status = 'published'
      AND mod.deleted_at IS NULL
  )
ORDER BY m.nomor_urut
```

---

## Tentor: Module Viewing

```
tentor/modul
  └── [mapelId]
        └── Same as siswa (published modules only)
        └── Filtered: only mapel where tentor teaches
              ├── via tentor_kelas_mapel (regular students)
              └── via tentor_siswa_privat (privat students)
```

### Route Details

| Route | Component | Filter |
|-------|-----------|--------|
| `tentor/modul/[mapelId]` | TentorMateriList | Mapel in (SELECT DISTINCT mapel_id FROM tentor_kelas_mapel WHERE tentor_id = auth.uid()) |

---

## Navigation Flows

### Kepala Guru: Create Content

```
Dashboard KG
  ↓
Click "Konten" menu
  ↓
/kepala-guru/konten/ (choose mapel)
  ↓
/kepala-guru/konten/[mapelId]/materi
  ↓ "Tambah Materi"
MateriForm (create)
  ↓ "Simpan"
Back to materi list
  ↓ Click materi → go to sub_materi page
/kepala-guru/konten/[mapelId]/materi/[materiId]
  ↓ "Tambah Sub Materi"
SubMateriForm (create)
  ↓ "Simpan"
Back to sub_materi list
  ↓ Click sub_materi → go to module page
/kepala-guru/konten/.../[subMateriId]/module
  ↓ Upload PDF
File input → [storagePath] → status='draft'
  ↓ Click "Publish"
Confirm → status='published' + published_at
```

### Siswa: View Content

```
Login (siswa role)
  ↓
Dashboard Siswa / Menu
  ↓ Click "Pelajaran"
siswa/mapel/[mapelId]
  ↓ Displays: published materi only
List: "Bab 1", "Bab 2"
  ↓ Click "Bab 1"
siswa/mapel/[mapelId]/[materiId]
  ↓ Displays: published sub_materi only
List: "Bagian 1.1", "Bagian 1.2"
  ↓ Click "Bagian 1.1"
siswa/mapel/.../[subMateriId]/module
  ↓
PDF Viewer (iframe)
  ↓ Native browser controls: zoom, print, download (browser decides)
```

### Tentor: View Assigned Content

```
Login (tentor role)
  ↓
Dashboard Tentor
  ↓ Click "Modul"
tentor/modul
  ↓ Auto-filtered: mapel where tentor teaches
List: "Matematika" (if tentor teaches math)
  ↓ Click "Matematika"
tentor/modul/[mapelId]
  ↓ Same as siswa view from here
tentor/modul/[mapelId]/[materiId]/[subMateriId]/module
  ↓
PDF Viewer
```

---

## Database Queries

### Materi Hierarchy

```sql
-- Get all content for a mapel (KG view)
SELECT 
  m.id, m.nama, m.nomor_urut,
  COUNT(DISTINCT sm.id) as sub_materi_count,
  COUNT(DISTINCT CASE WHEN mod.status='published' THEN mod.id END) as published_modules
FROM materi m
LEFT JOIN sub_materi sm ON sm.materi_id = m.id AND sm.deleted_at IS NULL
LEFT JOIN module mod ON mod.sub_materi_id = sm.id AND mod.deleted_at IS NULL
WHERE m.mapel_id = ? AND m.deleted_at IS NULL
GROUP BY m.id
ORDER BY m.nomor_urut;
```

### Siswa View (Published Only)

```sql
-- Get published materi for siswa
SELECT DISTINCT m.* FROM materi m
WHERE m.mapel_id = ? 
  AND m.deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM sub_materi sm
    JOIN module mod ON sm.id = mod.sub_materi_id
    WHERE sm.materi_id = m.id
      AND sm.deleted_at IS NULL
      AND mod.status = 'published'
      AND mod.deleted_at IS NULL
  )
ORDER BY m.nomor_urut;
```

### Tentor Scope

```sql
-- Get mapel where tentor teaches (regular classes)
SELECT DISTINCT tc.mapel_id
FROM tentor_kelas_mapel tc
WHERE tc.tentor_id = ? AND tc.deleted_at IS NULL
UNION
-- Get mapel where tentor teaches (privat students)
SELECT DISTINCT tsp.mapel_id
FROM tentor_siswa_privat tsp
WHERE tsp.tentor_id = ? AND tsp.deleted_at IS NULL;
```

---

## Summary: What Gets Built

| Feature | KG | Siswa | Tentor |
|---------|----|----|--------|
| Create materi | ✅ | — | — |
| Create sub_materi | ✅ | — | — |
| Upload module | ✅ | — | — |
| Publish module | ✅ | — | — |
| View published modules | — | ✅ | ✅ (filtered by mapel) |
| Respond to try-out | — | ✅ (Phase 2) | — |

---

## Implementation Order

**Priority:**
1. Sub Materi routes (mirror materi pattern)
2. Module page + upload handler
3. Siswa module list + PDF viewer (MVP)
4. Tentor list (extend siswa list with scope filter)
5. Search (lowest priority, client-side filter)

**Estimated:** 5-6 hours for complete Phase 1

