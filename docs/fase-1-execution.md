# Fase 1 — Runtutan Eksekusi

Cara pakai: buka Claude Code di folder `pena/`, lalu minta ikuti langkah-langkah ini
(bisa satu-satu atau beberapa sekaligus, dengan jeda review di antaranya).
`CLAUDE.md` dan `.claude/rules/content-hierarchy.md` terbaca otomatis di background.

Prasyarat: Fase 0 selesai — auth, master data (kelas, mapel), akun tentor/siswa/wali sudah bisa dibuat.

---

## Langkah 0 — Migration: Tambah Tingkat

```bash
supabase migration new add_tingkat
```

Tambah kolom `tingkat` (3–9) ke `mapel`, `kelas`, dan `siswa_detail` — lihat schema di `.claude/rules/content-hierarchy.md`.

Update juga form yang sudah dibuat di Fase 0:
- Form buat mapel → tambah dropdown tingkat
- Form buat kelas → tambah dropdown tingkat
- Form buat siswa paket privat → tambah dropdown tingkat (siswa reguler mewarisi dari kelas)

```bash
supabase db push
```

Kalau sudah terlanjur ada data mapel/kelas tanpa tingkat, isi manual dulu lewat SQL Editor sebelum menambahkan constraint `not null`.

## Langkah 1 — Migration: Materi & Sub Materi

```bash
supabase migration new create_materi_sub_materi
```

Isi sesuai schema di `.claude/rules/content-hierarchy.md` — tabel `materi` dan `sub_materi`, dengan `nomor_urut`, foreign key ke `mapel`, soft-delete.

```bash
supabase db push
```

## Langkah 2 — Migration: Module

```bash
supabase migration new create_module
```

Tabel `module` dengan `status` (draft/published), `published_at`, unique constraint `sub_materi_id`.

```bash
supabase db push
```

## Langkah 3 — Setup Supabase Storage Bucket

Di Supabase Dashboard → Storage → buat bucket baru:

- Nama: `modul-pdf`
- Public: **false** (akses lewat signed URL atau policy, bukan public bucket)
- File size limit: 20MB
- Allowed MIME types: `application/pdf`

Buat storage policy:

```sql
-- Kepala guru bisa upload
create policy "kg_upload_modul" on storage.objects
  for insert
  with check (
    bucket_id = 'modul-pdf'
    and (select role from profiles where id = auth.uid()) = 'kepala_guru'
  );

-- Semua role yang login bisa baca (filtering published/draft dilakukan di level aplikasi)
create policy "authenticated_read_modul" on storage.objects
  for select
  using (bucket_id = 'modul-pdf' and auth.role() = 'authenticated');
```

## Langkah 4 — Struktur Folder Feature

```bash
cd pena_web
mkdir -p src/features/module/{components,data}
```

## Langkah 5 — API Functions: Materi

Buat `src/features/module/data/materi.ts`:

- `listMateri(mapelId: string)` — ambil semua materi per mapel, urut `nomor_urut`, filter `deleted_at is null`
- `createMateri(mapelId, nama, nomorUrut)`
- `updateMateri(id, nama, nomorUrut)`
- `softDeleteMateri(id)`

## Langkah 6 — API Functions: Sub Materi

Buat `src/features/module/data/sub-materi.ts` — pola sama seperti materi, tapi scoped ke `materi_id`.

## Langkah 7 — API Functions: Module

Buat `src/features/module/data/module.ts`:

- `getModuleBySubMateri(subMateriId)`
- `uploadModule(subMateriId, file)` — upload ke Storage, insert/update row `module` dengan status `draft`
- `publishModule(id)` — set `status = 'published'`, `published_at = now()`. Tolak jika status sudah `published`.
- `replaceModule(id, file)` — hanya boleh jika status masih `draft`

## Langkah 8 — UI: Kelola Materi (Kepala Guru)

Route: `src/routes/kepala-guru/konten/[mapelId]/materi/+page.svelte`

- Tabel materi untuk mapel yang dipilih, urut `nomor_urut`
- Form tambah/edit: nama, nomor urut
- Tombol hapus (soft-delete)
- Link ke halaman sub materi per materi

## Langkah 9 — UI: Kelola Sub Materi (Kepala Guru)

Route: `src/routes/kepala-guru/konten/[mapelId]/materi/[materiId]/+page.svelte`

- Tabel sub materi untuk materi yang dipilih
- Form tambah/edit: nama, nomor urut
- Link ke halaman module per sub materi

## Langkah 10 — UI: Upload & Publish Module (Kepala Guru)

Route: `src/routes/kepala-guru/konten/.../sub-materi/[subMateriId]/module/+page.svelte`

- Upload PDF (drag-drop atau file picker)
- Tampilkan status saat ini: draft/published
- Kalau draft: tombol "Ganti File" dan tombol "Publish" (dengan confirmation)
- Kalau published: tampilkan info "Terkunci — sudah dipublish [tanggal]", tidak ada tombol edit

## Langkah 11 — UI: Lihat Modul (Siswa)

Route: `src/routes/siswa/mapel/[mapelId]/+page.svelte`

- Daftar materi (hanya yang punya konten published)
- Klik materi → daftar sub materi (hanya yang punya module published)
- Klik sub materi → PDF viewer

Gunakan `<embed>` atau `<iframe>` dengan signed URL dari Supabase Storage untuk render PDF. Cek library `pdf.js` kalau butuh kontrol lebih (zoom, page navigation) — tapi untuk MVP, native browser PDF viewer via iframe sudah cukup.

## Langkah 12 — UI: Lihat Modul (Tentor)

Route: `src/routes/tentor/modul/+page.svelte`

- Filter otomatis: hanya modul dari mapel yang tentor pegang (via `tentor_kelas_mapel` atau `tentor_siswa_privat`)
- Hanya tampilkan yang `published` — sama seperti siswa
- Struktur navigasi sama: mapel → materi → sub materi → PDF

## Langkah 13 — Search Bar (Siswa)

Di halaman `siswa/mapel/[mapelId]/+page.svelte`, tambahkan search input yang filter daftar materi berdasarkan `nama` (client-side filter cukup untuk skala ±50 siswa, tidak perlu full-text search database).

## Langkah 14 — Testing & Validasi

```
[ ] KG bisa buat materi dengan nomor urut
[ ] KG bisa buat sub materi di bawah materi
[ ] KG bisa upload PDF ke sub materi
[ ] KG bisa ganti PDF selama masih draft
[ ] KG bisa publish module
[ ] Setelah published, tombol edit/hapus hilang/disabled
[ ] Siswa tidak lihat materi yang semua sub-materi-nya draft
[ ] Siswa lihat materi begitu ada minimal 1 module published di dalamnya
[ ] Siswa bisa buka dan baca PDF
[ ] Search materi berfungsi
[ ] Tentor hanya lihat modul dari mapel yang dia pegang
[ ] Tentor tidak lihat modul draft
[ ] Urutan materi dan sub materi sesuai nomor_urut
[ ] Siswa kelas tingkat 4 TIDAK melihat mapel tingkat 5
[ ] Siswa privat melihat mapel sesuai tingkat di siswa_detail
[ ] Dua kelas di tingkat sama (5A dan 5B) melihat mapel dan materi yang sama
```

---

## Urutan Prioritas Jika Terbatas Waktu

1. Langkah 1-3 (migration + storage) — **wajib**
2. Langkah 5-7 (API functions) — **wajib**
3. Langkah 8-10 (UI Kepala Guru) — **wajib**, tanpa ini tidak ada konten sama sekali
4. Langkah 11 (UI Siswa) — **wajib**, ini tujuan akhir fase ini
5. Langkah 12 (UI Tentor) — bisa ditunda beberapa hari, siswa lebih prioritas
6. Langkah 13 (search) — bisa ditunda, tidak blocking fitur inti
