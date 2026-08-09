# Phase 2 Implementation Status

## Completed ✅

### Migrations (Langkah 1-4)
- ✅ `soal` + `pilihan_jawaban` — Questions & answer choices
- ✅ `try_out` + `try_out_kelas` — Exams & class scheduling  
- ✅ `attempt` + `jawaban_siswa` — Student attempts & answers
- ✅ `nilai_manual` — Manual grades with tentor authorization

### API Layer (Langkah 6-9)
- ✅ `src/features/question/data/soal.ts` — CRUD questions with validation (min 2 choices, exactly 1 correct)
- ✅ `src/features/question/data/try-out.ts` — Create, publish try outs, pre-test validation
- ✅ `src/features/question/data/attempt.ts` — Start attempt, auto-grade with CEIL rounding, reset with history
- ✅ `src/features/grading/data/nilai-manual.ts` — Manual grades with tentor-student verification

### Reusable Components
- ✅ `SoalForm.svelte` — Question editor with dynamic answer choices
- ✅ `SoalList.svelte` — Sidebar question list with edit/delete
- ✅ `TryOutForm.svelte` — Try out builder with scheduling & kelas selection

### UI Pages

#### KG (Kepala Guru) Pages
- ✅ **Langkah 10:** `/kepala-guru/konten/[mapelId]/materi/[materiId]/sub-materi/[id]/soal/`
  - Soal latihan builder (sidebar + editor pattern)
  - Add/edit/delete questions with validation
  
- ✅ **Langkah 11:** `/kepala-guru/konten/[mapelId]/materi/[id]/try-out/`
  - Try out builder with scheduling
  - Penjadwalan (waktu buka, durasi, target kelas)
  - Publish with soal validation (minimal 1 soal)
  - Pre-test uniqueness validation

#### Siswa (Student) Pages
- ✅ **Langkah 12:** `/siswa/mapel/[mapelId]/materi/[materiId]/sub-materi/[id]/latihan/`
  - Practice quiz with unlimited retries
  - Radio button choices
  - Auto-grade immediately on submit
  - Review after submission
  - Can retry anytime

- ✅ **Langkah 13:** `/siswa/mapel/[mapelId]/materi/[materiId]/try-out/[id]/`
  - Single-attempt exam within time window
  - **Countdown timer** (server-authoritative, auto-updates every 1 sec)
  - **Auto-save** each answer as selected
  - **Auto-submit** when time runs out (+ manual submit button)
  - Time window enforcement (hides soal before start time)
  - Review after submission

#### Tentor (Teacher) Pages
- ✅ **Langkah 14:** `/tentor/nilai/input/`
  - Dropdown to select mapel
  - Dropdown to select tipe test (pre_test / try_out / post_test)
  - Input judul & tanggal
  - Table to input nilai (0-100) + catatan per siswa
  - Tentor authorization check (only teach these students)

---

## Remaining (Langkah 15-16)

### Langkah 15: `/tentor/nilai/` — View Student Grades

**Features to build:**
- List all siswa taught by tentor
- Filter by mapel & kelas
- Show combined scores:
  - E-learning nilai (try outs)
  - Nilai manual (paper exams)
  - Rata-rata per siswa
  - Rata-rata per kelas
- Export to CSV (optional Phase 2)

**Data layer:** Already built — use `listNilaiManual()` + query attempts for try out scores

### Langkah 16: `/kepala-guru/monitoring/attempt/` — Reset Attempt

**Features to build:**
- List all try out attempts per siswa
- Show: siswa name, try out judul, nilai, submitted_at
- Filter by try out & kelas
- "Reset" button (confirmation popup)
- Show attempt history (is_active = false) 
- Only KG can reset (role check)

**Data layer:** Already built — use `resetAttempt()` in attempt.ts

---

## Testing

Run through `docs/fase-2-testing-guide.md` (TC-1 to TC-10) in Supabase Console before UI testing.

**Manual UI Testing Checklist:**
- [ ] KG create latihan soal (3+ pilihan, 1 benar, validate)
- [ ] Siswa attempt latihan, get score, retry
- [ ] KG create try out with kelas target, publish
- [ ] Siswa see try out only within time window
- [ ] Siswa attempt try out, timer counts down, auto-saves
- [ ] Close browser mid-try out → auto-submit at timeout
- [ ] Siswa cannot attempt try out 2x
- [ ] Tentor input nilai manual → shows in tentor nilai page
- [ ] KG reset attempt → old inactive, new active with empty nilai

---

## Architecture Notes

### Data Flow: Student Try Out

```
/siswa/try-out/[id] (load)
  ↓
Check time window (server-side)
  ↓
Load try out + soal (NOT shown to client yet if before waktu_buka)
  ↓
Student clicks "Mulai"
  ↓
startAttempt() → new row in attempt table
  ↓
Each radio select → saveJawaban() → upsert in jawaban_siswa
  ↓
Timer counts down (local, display only)
  ↓
Manual submit OR time=0
  ↓
submitAttempt() → query jawaban_siswa + soal + pilihan_jawaban
             → count correct (join is_benar flag)
             → nilai = CEIL((benar/total) * 100)
             → update attempt with nilai + submitted_at
  ↓
Show score + review
```

### Key Validations

- **Soal:** Min 2 pilihan, exactly 1 `is_benar`
- **Try out:** Min 1 soal before publish, 1 pre_test per mapel per year
- **Attempt (try out):** 1 attempt per siswa, time window check, auto-submit at timeout
- **Attempt (latihan):** Unlimited retries per siswa
- **Nilai Manual:** Tentor can only grade students they teach (via tentor_kelas_mapel or tentor_siswa_privat)
- **Reset Attempt:** Only kepala_guru role

---

## Next Steps

1. **Build Langkah 15-16** (remaining pages)
2. **Test all pages** with manual browser testing  
3. **Update design** if needed per design-system.md
4. **Create fase-2-complete.md** with final checklist & next phase (Phase 3: Attendance & Journal)
