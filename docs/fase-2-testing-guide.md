# Fase 2 — Testing Guide

Panduan testing untuk fitur **Soal & Penilaian** (Try Out, Latihan Soal, Auto-Grade, Nilai Manual).

**Prerequisites:**
- Fase 1 selesai — materi, sub materi, modul PDF berjalan
- 4 migrations sudah ter-push: `soal`, `try_out`, `attempt`, `nilai_manual`
- API functions sudah di-create di `src/features/question/data/` dan `src/features/grading/data/`

---

## Test Data Setup

Sebelum mulai testing, setup data di Supabase console:

### 1. Pastikan Materi & Sub Materi Ada

Buka Supabase Console → SQL Editor:

```sql
-- Lihat materi yang ada
select id, nama, mapel_id from materi where deleted_at is null limit 5;

-- Lihat sub_materi
select id, nama, materi_id from sub_materi where deleted_at is null limit 5;
```

Catat:
- **materi_id** untuk testing try out
- **sub_materi_id** untuk testing latihan soal

### 2. Pastikan Ada Siswa & Kelas

```sql
-- Lihat kelas
select id, nama, tingkat from kelas where deleted_at is null;

-- Lihat siswa_detail
select id, nama_lengkap, paket from siswa_detail where deleted_at is null limit 5;

-- Lihat siswa di kelas (untuk try out)
select sd.id, sd.nama_lengkap, sk.kelas_id from siswa_detail sd
left join siswa_kelas sk on sk.siswa_detail_id = sd.id
where sd.deleted_at is null limit 5;
```

Catat:
- **kelas_id** untuk try out target
- **siswa_detail_id** untuk attempt testing
- **tahun_ajaran_id** (aktif)

---

## TC-1: Create Latihan Soal (Practice Quiz)

**Tujuan:** Test membuat soal per sub materi dengan multiple choice options.

### Step 1: Buka Supabase Console → SQL Editor

Copy **sub_materi_id** dari langkah setup.

### Step 2: Insert Soal Pertama

```sql
insert into soal (sub_materi_id, pertanyaan, nomor_urut)
values (
  'YOUR_SUB_MATERI_ID',
  'Berapa hasil dari 2 + 2?',
  1
);
```

**Expected:** Soal ter-insert dengan ID.

Catat **soal_id** dari hasil query.

### Step 3: Insert Pilihan Jawaban

```sql
insert into pilihan_jawaban (soal_id, teks, is_benar, nomor_urut)
values
  ('YOUR_SOAL_ID', '3', false, 1),
  ('YOUR_SOAL_ID', '4', true, 2),
  ('YOUR_SOAL_ID', '5', false, 3);
```

**Expected:** 3 pilihan ter-insert, tepat 1 `is_benar = true`.

### Step 4: Verify Constraint

Coba insert soal tanpa sub_materi_id dan materi_id:

```sql
insert into soal (pertanyaan, nomor_urut)
values ('Soal tanpa induk', 1);
```

**Expected:** Error — `check (num_nonnulls(sub_materi_id, materi_id) = 1)` ditolak.

✅ **PASS** jika constraint bekerja.

---

## TC-2: Create Try Out (Exam)

**Tujuan:** Test membuat try out dengan penjadwalan dan target kelas.

### Step 1: Prepare Data

Dari setup, catat:
- **materi_id**
- **kelas_id** (minimal 1)
- **tahun_ajaran_id**

### Step 2: Insert Try Out

```sql
insert into try_out (
  materi_id,
  judul,
  tipe_test,
  waktu_buka,
  durasi_menit,
  status,
  tahun_ajaran_id
)
values (
  'YOUR_MATERI_ID',
  'Try Out Matematika Bab 1',
  'biasa',
  '2026-08-10 09:00:00+07',
  60,
  'draft',
  'YOUR_TAHUN_AJARAN_ID'
);
```

**Expected:** Try out ter-insert dengan status `draft`. Catat **try_out_id**.

### Step 3: Assign Kelas

```sql
insert into try_out_kelas (try_out_id, kelas_id)
values
  ('YOUR_TRY_OUT_ID', 'KELAS_ID_1'),
  ('YOUR_TRY_OUT_ID', 'KELAS_ID_2');
```

**Expected:** 2 kelas ter-assign.

### Step 4: Insert Soal Try Out

```sql
insert into soal (materi_id, pertanyaan, nomor_urut)
values
  ('YOUR_MATERI_ID', 'Soal try out nomor 1?', 1),
  ('YOUR_MATERI_ID', 'Soal try out nomor 2?', 2);
```

**Expected:** 2 soal ter-insert. Assign pilihan jawaban seperti TC-1.

### Step 5: Publish Try Out

```sql
update try_out
set status = 'published', published_at = now()
where id = 'YOUR_TRY_OUT_ID';
```

**Expected:** Status berubah ke `published`, `published_at` ter-set.

✅ **PASS** jika try out published dan visible.

---

## TC-3: Student Take Latihan (Unlimited Attempts)

**Tujuan:** Test siswa mengerjakan latihan, bisa diulang berkali-kali.

### Step 1: Create Attempt

```sql
insert into attempt (siswa_detail_id, sub_materi_id, tahun_ajaran_id)
values ('YOUR_SISWA_DETAIL_ID', 'YOUR_SUB_MATERI_ID', 'YOUR_TAHUN_AJARAN_ID')
returning id;
```

**Expected:** Attempt ter-create dengan `is_active = true`, `submitted_at = null`.

Catat **attempt_id**.

### Step 2: Save Answers (Incremental)

Siswa menjawab soal satu per satu. Setiap pilihan disimpan langsung:

```sql
insert into jawaban_siswa (attempt_id, soal_id, pilihan_jawaban_id)
values ('YOUR_ATTEMPT_ID', 'SOAL_ID_1', 'PILIHAN_BENAR_ID')
on conflict (attempt_id, soal_id) do update set
  pilihan_jawaban_id = excluded.pilihan_jawaban_id;
```

**Expected:** Jawaban tersimpan. Jika siswa ganti jawaban, `on conflict` update record lama.

### Step 3: Submit Attempt

```sql
-- Hitung jumlah soal
select count(*) as total_soal from soal
where sub_materi_id = 'YOUR_SUB_MATERI_ID' and deleted_at is null;

-- Hitung jawaban benar
select count(*) as benar from jawaban_siswa js
join pilihan_jawaban pj on pj.id = js.pilihan_jawaban_id
where js.attempt_id = 'YOUR_ATTEMPT_ID'
and pj.is_benar = true;
```

Manual calculation:
- Nilai = CEIL((benar / total) × 100)
- Contoh: 2 benar dari 3 soal = CEIL((2/3) × 100) = 67

```sql
update attempt
set submitted_at = now(), nilai = 67
where id = 'YOUR_ATTEMPT_ID';
```

**Expected:** `submitted_at` ter-set, `nilai` = 67.

### Step 4: Retry Latihan

Buat attempt baru untuk siswa yang sama, sub materi yang sama:

```sql
insert into attempt (siswa_detail_id, sub_materi_id, tahun_ajaran_id)
values ('YOUR_SISWA_DETAIL_ID', 'YOUR_SUB_MATERI_ID', 'YOUR_TAHUN_AJARAN_ID')
returning id;
```

**Expected:** Attempt baru ter-create. Siswa bisa submit lagi dengan nilai berbeda.

✅ **PASS** jika siswa bisa retry latihan berkali-kali.

---

## TC-4: Student Take Try Out (Single Attempt, Timed)

**Tujuan:** Test siswa mengerjakan try out — hanya 1 kali, dalam jendela waktu, auto-submit saat waktu habis.

### Step 1: Set Try Out Time Window

Update try out buat jendela waktu mundur (5 menit dari sekarang):

```sql
update try_out
set waktu_buka = now() - interval '1 minute',
    durasi_menit = 5
where id = 'YOUR_TRY_OUT_ID';
```

**Expected:** Try out dalam jendela waktu sekarang.

### Step 2: Create Attempt

```sql
insert into attempt (siswa_detail_id, try_out_id, tahun_ajaran_id)
values ('YOUR_SISWA_DETAIL_ID', 'YOUR_TRY_OUT_ID', 'YOUR_TAHUN_AJARAN_ID')
returning id, started_at;
```

**Expected:** Attempt ter-create, `started_at = now()`.

Catat **attempt_id** dan **started_at**.

### Step 3: Try Outside Time Window

Attempt lagi untuk siswa yang sama, try out yang sama:

```sql
insert into attempt (siswa_detail_id, try_out_id, tahun_ajaran_id)
values ('YOUR_SISWA_DETAIL_ID', 'YOUR_TRY_OUT_ID', 'YOUR_TAHUN_AJARAN_ID');
```

**Expected:** Error — sudah ada attempt aktif. Tolak.

### Step 4: Save Answers (Try Out)

Sama seperti TC-3, save jawaban incremental:

```sql
insert into jawaban_siswa (attempt_id, soal_id, pilihan_jawaban_id)
values ('YOUR_ATTEMPT_ID', 'SOAL_ID_1', 'PILIHAN_ID');
```

**Expected:** Jawaban tersimpan.

### Step 5: Auto-Submit Saat Waktu Habis (Simulation)

Simulasi: waktu sudah habis (started_at + durasi > sekarang):

```sql
-- Setelah 5 menit berlalu (simulasi dengan update try out durasi jadi 0)
update try_out set durasi_menit = 0 where id = 'YOUR_TRY_OUT_ID';

-- Hitung nilai seperti TC-3
-- Update attempt dengan submitted_at dan nilai
update attempt
set submitted_at = now(), nilai = 50
where id = 'YOUR_ATTEMPT_ID'
and submitted_at is null;
```

**Expected:** Attempt auto-submitted, nilai ter-set.

### Step 6: Verify No Double Attempt

Coba submit lagi:

```sql
select * from attempt where siswa_detail_id = 'YOUR_SISWA_DETAIL_ID'
and try_out_id = 'YOUR_TRY_OUT_ID' and is_active = true;
```

**Expected:** Hanya ada 1 attempt aktif (is_active = true).

✅ **PASS** jika siswa tidak bisa attempt 2x.

---

## TC-5: Auto-Grade Score (CEIL)

**Tujuan:** Verify nilai dibulatkan ke atas.

### Cases:

```
Benar | Total | Rumus                  | Harapan
------|-------|------------------------|----------
1     | 3     | (1/3) × 100 = 33.33    | 34
2     | 3     | (2/3) × 100 = 66.67    | 67
1     | 2     | (1/2) × 100 = 50       | 50
3     | 5     | (3/5) × 100 = 60       | 60
```

Untuk setiap case, insert soal, jawaban, submit, verify nilai.

✅ **PASS** jika nilai selalu dibulatkan ke atas (67, bukan 66).

---

## TC-6: Pre-Test Validation (One Per Mapel Per Year)

**Tujuan:** Ensure hanya 1 pre_test per mapel per tahun ajaran.

### Step 1: Create Pre-Test 1

```sql
insert into try_out (materi_id, judul, tipe_test, waktu_buka, durasi_menit, status, tahun_ajaran_id)
values (
  'YOUR_MATERI_ID',
  'Pre-Test Matematika',
  'pre_test',
  now(),
  60,
  'draft',
  'YOUR_TAHUN_AJARAN_ID'
);
```

**Expected:** Pre-test ter-create.

### Step 2: Try Create Pre-Test 2 (Same Mapel, Same Year)

```sql
-- Ambil materi_id yang sama, materi tersebut punya mapel_id yang sama
insert into try_out (materi_id, judul, tipe_test, waktu_buka, durasi_menit, status, tahun_ajaran_id)
values (
  'MATERI_ID_SAME_MAPEL',
  'Pre-Test Matematika 2',
  'pre_test',
  now(),
  60,
  'draft',
  'YOUR_TAHUN_AJARAN_ID'
);
```

**Expected di API:** Error — "Sudah ada pre_test untuk mapel ini".

Manual SQL check (untuk verify di console):

```sql
select count(*) from try_out
where tipe_test = 'pre_test' and tahun_ajaran_id = 'YOUR_TAHUN_AJARAN_ID'
group by mapel_id having count(*) > 1;
```

**Expected:** No rows — tidak ada mapel dengan > 1 pre_test.

✅ **PASS** jika validation bekerja.

---

## TC-7: Manual Grade (Tentor Input)

**Tujuan:** Tentor input nilai untuk siswa yang dia ajar (dari paper exam).

### Step 1: Verify Tentor-Siswa Relationship

```sql
-- Tentor mengajar siswa via kelas
select tkm.tentor_id, sk.siswa_detail_id, tkm.mapel_id
from tentor_kelas_mapel tkm
join siswa_kelas sk on sk.kelas_id = tkm.kelas_id
where tkm.deleted_at is null and sk.deleted_at is null
limit 1;
```

Catat: **tentor_id**, **siswa_detail_id**, **mapel_id**.

### Step 2: Insert Manual Grade

```sql
insert into nilai_manual (
  siswa_detail_id,
  mapel_id,
  tipe_test,
  judul,
  tanggal,
  nilai,
  catatan,
  tentor_id,
  tahun_ajaran_id
)
values (
  'YOUR_SISWA_DETAIL_ID',
  'YOUR_MAPEL_ID',
  'try_out',
  'Ulangan Harian Bab 1',
  '2026-08-10',
  85,
  'Bagus, tapi kurang cermat',
  'YOUR_TENTOR_ID',
  'YOUR_TAHUN_AJARAN_ID'
);
```

**Expected:** Nilai manual ter-insert.

### Step 3: Try Insert Manual Grade for Non-Taught Student

Coba tentor input nilai untuk siswa yang tidak dia ajar:

```sql
-- Cari tentor lain atau siswa tidak di kelas tentor
insert into nilai_manual (
  siswa_detail_id,
  mapel_id,
  tipe_test,
  judul,
  tanggal,
  nilai,
  tentor_id,
  tahun_ajaran_id
)
values (
  'SISWA_TIDAK_DIAJAR',
  'YOUR_MAPEL_ID',
  'try_out',
  'Ulangan',
  '2026-08-10',
  80,
  'YOUR_TENTOR_ID',
  'YOUR_TAHUN_AJARAN_ID'
);
```

**Expected di API:** Error — "Tentor tidak mengajar siswa ini".

✅ **PASS** jika validation bekerja.

---

## TC-8: Reset Attempt (KG Only)

**Tujuan:** KG bisa reset attempt try out — buat attempt baru, mark lama jadi `is_active = false`.

### Step 1: Get Active Attempt

```sql
select id from attempt
where siswa_detail_id = 'YOUR_SISWA_DETAIL_ID'
and try_out_id = 'YOUR_TRY_OUT_ID'
and is_active = true
limit 1;
```

Catat **old_attempt_id**.

### Step 2: Reset (KG Action)

Manual SQL simulation (API akan handle logic):

```sql
-- Mark lama inactive
update attempt set is_active = false where id = 'OLD_ATTEMPT_ID';

-- Buat attempt baru
insert into attempt (siswa_detail_id, try_out_id, tahun_ajaran_id)
values ('YOUR_SISWA_DETAIL_ID', 'YOUR_TRY_OUT_ID', 'YOUR_TAHUN_AJARAN_ID')
returning id;
```

**Expected:** Attempt lama `is_active = false`, attempt baru `is_active = true`, `submitted_at = null`.

### Step 3: Verify History

```sql
select id, is_active, submitted_at, nilai from attempt
where siswa_detail_id = 'YOUR_SISWA_DETAIL_ID'
and try_out_id = 'YOUR_TRY_OUT_ID'
order by created_at desc;
```

**Expected:** 2 rows — 1 old (is_active=false, nilai=lama), 1 new (is_active=true, nilai=null).

✅ **PASS** jika history tersimpan.

---

## TC-9: Student Can't See Try Out Before Open Time

**Tujuan:** Soal try out tidak dikirim ke klien sebelum waktu buka.

### Step 1: Create Future Try Out

```sql
insert into try_out (
  materi_id,
  judul,
  tipe_test,
  waktu_buka,
  durasi_menit,
  status,
  tahun_ajaran_id
)
values (
  'YOUR_MATERI_ID',
  'Try Out Besok',
  'biasa',
  '2026-08-11 09:00:00+07',
  60,
  'published',
  'YOUR_TAHUN_AJARAN_ID'
);
```

**Expected di server:** Soal try out tidak dikembalikan ke siswa sebelum waktu_buka.

(Ini diverifikasi saat UI page di-build — server-side check di `+page.server.ts`).

✅ **PASS** jika soal hidden dari siswa.

---

## TC-10: Non-Attempted Try Out = Score 0

**Tujuan:** Siswa yang tidak attempt try out sebelum tutup jadwal dapat nilai 0, bukan null.

### Step 1: Create Try Out

Buat try out dengan waktu sudah lewat:

```sql
insert into try_out (
  materi_id,
  judul,
  tipe_test,
  waktu_buka,
  durasi_menit,
  status,
  tahun_ajaran_id
)
values (
  'YOUR_MATERI_ID',
  'Try Out Kemarin',
  'biasa',
  now() - interval '2 hours',
  60,
  'published',
  'YOUR_TAHUN_AJARAN_ID'
);
```

### Step 2: No Attempt Created

Don't create attempt untuk siswa tertentu.

### Step 3: Query Grade Report

```sql
select sd.nama_lengkap, a.nilai, a.submitted_at
from siswa_detail sd
left join attempt a on a.siswa_detail_id = sd.id and a.try_out_id = 'YOUR_TRY_OUT_ID'
where sd.kelas_id = 'YOUR_KELAS_ID';
```

**Expected di UI/report:** Siswa tanpa attempt tampil dengan nilai **0** (atau manual insert nilai 0 sebagai fallback).

(Logika ini di-implement di grading layer nanti.)

✅ **PASS** jika report menunjukkan 0, bukan null.

---

## Summary Checklist

- [ ] TC-1: Latihan soal dengan pilihan jawaban PASS
- [ ] TC-2: Try out creation, kelas assignment, publish PASS
- [ ] TC-3: Siswa retry latihan unlimited PASS
- [ ] TC-4: Try out single attempt, timed window PASS
- [ ] TC-5: Score rounding (CEIL) PASS
- [ ] TC-6: Pre-test validation (1 per mapel) PASS
- [ ] TC-7: Manual grade with authorization PASS
- [ ] TC-8: Reset attempt history PASS
- [ ] TC-9: Try out hidden before open time PASS
- [ ] TC-10: Non-attempted = 0 score PASS

---

## Notes untuk Phase 2 UI Implementation

Setelah semua TC PASS di Supabase console, baru mulai build UI pages (Langkah 10-16):

1. **Langkah 10:** Builder soal latihan (`(kepala-guru)/konten/.../sub-materi/[id]/soal/`)
2. **Langkah 11:** Builder try out (`(kepala-guru)/konten/.../materi/[id]/try-out/`)
3. **Langkah 12:** Siswa kerjakan latihan (`(siswa)/mapel/.../latihan/`)
4. **Langkah 13:** Siswa kerjakan try out (`(siswa)/mapel/.../try-out/[id]/`)
5. **Langkah 14:** Tentor input nilai manual (`(tentor)/nilai/input/`)
6. **Langkah 15:** Tentor lihat nilai (`(tentor)/nilai/`)
7. **Langkah 16:** KG reset attempt (`(kepala-guru)/monitoring/attempt/`)

Setelah UI siap, test manual di browser untuk memastikan flow end-to-end berjalan.
