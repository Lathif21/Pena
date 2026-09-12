# Fase 3 — Runtutan Eksekusi

Cara pakai: buka Claude Code di folder `pena/`, minta ikuti langkah-langkah ini.
`CLAUDE.md`, `.claude/rules/sesi-mengajar.md`, dan `.claude/rules/design-system.md` terbaca otomatis.

Prasyarat: Fase 2 selesai — soal, try out, nilai manual sudah jalan.

> **Terminal: PowerShell.** Jangan campur sintaks Bash (`mkdir -p`, `{a,b}`). Bungkus path dalam tanda kutip, dan tulis kurung siku segmen dinamis **tanpa escape** — `"src/routes/siswa/mapel/[mapelId]"`. Escape backslash (`\[id\]`) menghasilkan nama folder rusak; ini penyebab masalah route di Fase 2.
>
> Folder route ditulis biasa (`tentor/`, `kepala-guru/`), bukan route group berkurung — lihat `.claude/rules/structure-web.md`.

**Commit setiap selesai satu langkah.** `git add . ; git commit -m "feat: <langkah>"`

---

## Langkah 1 — Migration: Sesi Mengajar

```bash
supabase migration new create_sesi_mengajar
```

Tabel `sesi_mengajar` sesuai schema di `.claude/rules/sesi-mengajar.md`.

```bash
supabase db push
```

## Langkah 2 — Migration: Presensi Murid & Jurnal

```bash
supabase migration new create_presensi_jurnal
```

Tabel `presensi_murid` (unique per sesi+siswa) dan `jurnal_mengajar` (unique per sesi).

## Langkah 3 — Migration: RPC Selesai Mengajar

```bash
supabase migration new create_close_sesi_rpc
```

Postgres function `close_sesi(p_sesi_id uuid)` yang menjalankan tiga efek dalam satu transaksi:

```sql
create or replace function close_sesi(p_sesi_id uuid)
returns void
language plpgsql
as $$
begin
  if not exists (
    select 1 from jurnal_mengajar
    where sesi_id = p_sesi_id and deleted_at is null
  ) then
    raise exception 'Jurnal mengajar belum diisi';
  end if;

  update sesi_mengajar
     set ended_at = now(), status = 'closed'
   where id = p_sesi_id and status = 'open';

  update jurnal_mengajar
     set status = 'submitted', submitted_at = now()
   where sesi_id = p_sesi_id;
end;
$$;
```

Ini bukan optimasi prematur — tiga query terpisah bisa gagal di tengah dan meninggalkan sesi setengah tertutup, yang merusak perhitungan KPI di Fase 5.

## Langkah 4 — Storage Bucket

Dashboard Supabase → Storage → buat bucket `presensi-foto`:
- Public: **false**
- File size limit: 5MB
- Allowed MIME types: `image/jpeg`, `image/png`

Policy: tentor bisa insert, KG bisa select semua, tentor bisa select miliknya sendiri.

> Jangan simpan foto di `static/uploads`. Folder `static/` disajikan publik tanpa autentikasi — foto presensi mengandung lokasi dan waktu tentor.

## Langkah 5 — Struktur Folder

```powershell
cd pena_web
New-Item -ItemType Directory -Force -Path "src/features/attendance/components"
New-Item -ItemType Directory -Force -Path "src/features/attendance/data"
New-Item -ItemType Directory -Force -Path "src/features/journal/components"
New-Item -ItemType Directory -Force -Path "src/features/journal/data"
New-Item -ItemType Directory -Force -Path "src/features/session/data"

New-Item -ItemType Directory -Force -Path "src/routes/tentor/presensi/diri"
New-Item -ItemType Directory -Force -Path "src/routes/tentor/presensi/murid"
New-Item -ItemType Directory -Force -Path "src/routes/tentor/jurnal"
New-Item -ItemType Directory -Force -Path "src/routes/kepala-guru/monitoring/presensi"
New-Item -ItemType Directory -Force -Path "src/routes/kepala-guru/monitoring/jurnal"
New-Item -ItemType Directory -Force -Path "src/routes/kepala-guru/monitoring/sesi"

New-Item -ItemType Directory -Force -Path "src/routes/api/sesi"
New-Item -ItemType Directory -Force -Path "src/routes/api/presensi-murid"
New-Item -ItemType Directory -Force -Path "src/routes/api/jurnal"
```

Verifikasi: `Get-ChildItem -Recurse -Directory src/routes | Select-Object FullName`

## Langkah 6 — API: Sesi & Presensi Tentor

`src/features/attendance/data/sesi.ts`:
- `listKelasByTentor(tentorId)` — dari `tentor_kelas_mapel`
- `listMapelByKelas(kelasId, tentorId)` — irisan `mapel_kelas` dan `tentor_kelas_mapel`
- `openSesi(tentorId, kelasId, mapelId, file)` — upload foto, insert `sesi_mengajar` status `open`
- `getSesiAktif(tentorId)` — sesi `open` milik tentor ini
- `replaceFoto(sesiId, file)` — hanya jika sesi masih `open`

Endpoint `/api/sesi` menangani otorisasi: cek `tentor_kelas_mapel` sebelum insert.

## Langkah 7 — API: Presensi Murid

`src/features/attendance/data/presensi-murid.ts`:
- `listSiswaByKelas(kelasId)` — dari `siswa_kelas`; siswa privat otomatis tidak muncul karena tidak punya kelas
- `savePresensi(sesiId, entries[])` — upsert per siswa

Endpoint `/api/presensi-murid`: tolak kalau sesi tidak ada, bukan milik tentor pemanggil, atau sudah `closed`.

## Langkah 8 — API: Jurnal

`src/features/journal/data/jurnal.ts`:
- `listMateriByMapel(mapelId)` — untuk dropdown
- `saveJurnal(sesiId, materiId, deskripsi)` — insert/update status `draft`
- `getJurnalBySesi(sesiId)`

## Langkah 9 — API: Selesai Mengajar

`src/features/session/data/close-sesi.ts` — panggil RPC `close_sesi` dari Langkah 3, jangan tiga query terpisah.

Endpoint `/api/sesi/[id]/close`: cek kepemilikan, panggil RPC, terjemahkan exception jurnal jadi pesan yang bisa dibaca user.

## Langkah 10 — UI Tentor: Dashboard

`tentor/dashboard/+page.svelte`

Referensi visual: `docs/design-reference/Tentor_Dashboard.png`.

- Sapaan "Selamat pagi, [nama]"
- Status sesi hari ini: belum mulai / sedang berjalan / selesai
- Card menu: Presensi Diri, Presensi Murid, Input Nilai, Jurnal, Lihat Modul
- Tombol Selesai Mengajar, disabled kalau jurnal belum ada

## Langkah 11 — UI Tentor: Presensi Diri

`tentor/presensi/diri/+page.svelte`

- Dropdown kelas → dropdown mapel (terfilter `mapel_kelas`)
- File input foto, preview sebelum submit
- Setelah submit: tampilkan foto + `uploaded_at`

## Langkah 12 — UI Tentor: Presensi Murid

`tentor/presensi/murid/+page.svelte`

- Kalau belum ada sesi aktif: pesan "Submit presensi diri dulu" + link
- Tabel siswa dari kelas sesi aktif, checkbox default tercentang
- Tombol simpan

## Langkah 13 — UI Tentor: Jurnal Mengajar

`tentor/jurnal/+page.svelte`

- Dropdown materi (dari mapel sesi aktif)
- Textarea deskripsi
- Tombol "Simpan Draft", indikator status draft/submitted

## Langkah 14 — UI Tentor: Selesai Mengajar

Confirmation popup: "Yakin selesai mengajar? Presensi dan jurnal akan dikunci."
Setelah konfirmasi: panggil `/api/sesi/[id]/close`, redirect ke dashboard.

## Langkah 15 — UI KG: Monitoring Presensi Tentor

`kepala-guru/monitoring/presensi/+page.svelte`

- Filter tanggal dan tentor
- Tabel: tentor, kelas, mapel, foto thumbnail (klik perbesar), `uploaded_at`
- Tampilkan **kedua** timestamp: yang terbakar di foto (KG baca sendiri) dan `uploaded_at` sistem

## Langkah 16 — UI KG: Monitoring Jurnal

`kepala-guru/monitoring/jurnal/+page.svelte`

- Daftar jurnal submitted, filter tentor dan tanggal
- Isi: materi, deskripsi, tanggal sesi
- Tanpa tombol approve/reject

## Langkah 17 — UI KG: Monitoring Sesi

`kepala-guru/monitoring/sesi/+page.svelte`

Ringkasan per sesi closed: presensi tentor (foto), presensi murid (hadir dari total), jurnal, nilai manual hari itu.

## Langkah 18 — Testing

Ikuti `docs/fase-3-testing-guide.md`.

---

## Urutan Prioritas Jika Terbatas Waktu

1. Langkah 1-4 (migration + RPC + storage) — wajib
2. Langkah 6-9 (API) — wajib
3. Langkah 11-14 (UI tentor) — wajib, ini inti fase
4. Langkah 15-16 (monitoring KG) — wajib untuk KPI Fase 5
5. Langkah 10 (dashboard tentor) — bisa disederhanakan jadi menu list
6. Langkah 17 (monitoring sesi gabungan) — bisa ditunda

---

## Catatan Dokumentasi

Fase 2 menghasilkan lima file status yang isinya tumpang tindih (`complete`, `final-status`, `implementation-status`, `all-routes-ready`, `routes-fixed`). Untuk Fase 3, cukup dua file: **execution guide** ini dan **testing guide**. Status progres dicatat lewat commit git, bukan file markdown baru tiap sesi.
