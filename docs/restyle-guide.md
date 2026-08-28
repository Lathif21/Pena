# Panduan Restyle — Menyesuaikan Halaman Lama ke Design System Baru

Versi 2. Direvisi setelah audit menemukan empat kesalahan di versi pertama: perintah scan tidak rekursif, instruksi ditulis untuk Tailwind v3 padahal proyek memakai v4, sidebar diasumsikan sudah ada padahal belum pernah dibuat, dan beban sebenarnya (kelas `gray-`) tidak pernah dihitung.

## Kondisi Nyata Proyek

Dari hasil audit:

| Item | Jumlah | Catatan |
|---|---|---|
| Hex ungu lama | 2 | Di `layout.css` |
| Kelas indigo/purple/violet | 5 di 3 file | |
| `shadow-` | 5 di 5 file | |
| **Kelas `gray-`** | **775 occurrence** (674 baris) di 56 file | Beban terbesar |
| Sidebar | **Tidak ada** | Konstruksi baru, bukan penggantian |
| Halaman dengan wrapper `min-h-screen` sendiri | 35 | Semuanya tersentuh saat shell dipasang |

Stack: **Tailwind v4** dengan `@tailwindcss/vite`. Token tinggal di blok `@theme` dalam `layout.css`. `tailwind.config.js` ada tapi tidak terbaca — jangan diisi, jangan diandalkan.

Tidak ada `src/app.css`.

---

## Langkah 0 — Bersihkan Git

`git status` harus bersih sebelum apa pun dimulai. Restyle menyentuh puluhan file; tanpa titik pulih, satu kesalahan menghapus kerja berhari-hari.

```powershell
git add .
git commit -m "chore: checkpoint sebelum restyle"
```

## Langkah 1 — Audit (Perintah yang Benar)

`Select-String -Path "src/**/*.svelte"` **tidak rekursif** di PowerShell — `**` diperlakukan sama seperti `*`, jadi hanya cocok satu level. Sebagian besar file di proyek ini berada 3–6 level dalam. Pakai ini:

```powershell
cd pena_web

function Scan($pattern) {
  Get-ChildItem src -Recurse -Include *.svelte,*.css,*.ts |
    Select-String -Pattern $pattern
}

Scan "6C5DD3|5A4CC0|F7F7F9"                        # hex lama
Scan "(bg|text|border)-(indigo|purple|violet)-"    # kelas ungu
Scan "shadow-"                                     # shadow
(Scan "(bg|text|border)-gray-").Count              # beban sebenarnya
Scan "min-h-screen"                                # halaman yang perlu dilepas wrapper-nya
```

Sudah dijalankan — hasilnya di tabel Kondisi Nyata. Jalankan ulang setelah tiap fase untuk melihat sisa.

## Langkah 2 — Token di `@theme` (Tailwind v4)

Buka `src/routes/layout.css` (file yang memuat `@import "tailwindcss"`). Ganti dua hex ungu lama, lalu isi blok `@theme`:

```css
@import "tailwindcss";

@theme {
  --color-background: #F5F3EF;
  --color-foreground: #1A1714;
  --color-card: #FFFFFF;
  --color-primary: #1E3A5F;
  --color-primary-foreground: #FFFFFF;
  --color-secondary: #EDF3F8;
  --color-secondary-foreground: #1E3A5F;
  --color-muted: #E4E0D8;
  --color-muted-foreground: #716860;
  --color-accent: #C17F2E;
  --color-accent-foreground: #FFFFFF;
  --color-destructive: #C0392B;
  --color-border: rgba(26, 23, 20, 0.1);
  --color-input-background: #EDEAE4;

  --color-sidebar: #1E3A5F;
  --color-sidebar-foreground: #F5F3EF;
  --color-sidebar-accent: #264D73;
  --color-sidebar-border: rgba(245, 243, 239, 0.12);

  --color-chart-1: #1E3A5F;
  --color-chart-2: #C17F2E;
  --color-chart-3: #2E7D52;
  --color-chart-4: #8B4513;
  --color-chart-5: #5B2C6F;

  --font-serif: "DM Serif Display", Georgia, serif;
  --font-sans: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-mono: "DM Mono", monospace;

  --radius: 0.5rem;

  /* TOKEN JEMBATAN — sementara, hapus di Langkah 6.
     Ada hanya supaya 52 pemakaian lama tidak mati senyap saat Langkah 2.
     Di v4, token yang hilang dari @theme membuat utility-nya tidak
     ter-generate: kelasnya mati tanpa error. */
  --color-primary-hover: #264D73;   /* = sidebar-accent, navy terang */
  --color-danger: #C0392B;          /* = destructive */
}
```

Di v4, prefix `--color-*` di dalam `@theme` otomatis menghasilkan utility `bg-primary`, `text-muted-foreground`, `border-border`, dan seterusnya. Tidak perlu menyentuh `tailwind.config.js`.

Font di `src/app.html` bagian `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Verifikasi sebelum commit.** Tambahkan elemen uji `<div class="bg-primary text-card p-4">test</div>` di satu halaman, jalankan `npm run dev`, pastikan warnanya navy. Kalau transparan atau error, token belum terbaca — jangan lanjut. Hapus elemen uji setelah terbukti.

Commit: `feat: design tokens + fonts`

## Langkah 3 — Peta Penggantian Gray

775 occurrence bukan 775 keputusan. Sebagian besar mengikuti pola yang bisa dipetakan langsung:

| Lama | Baru | Konteks |
|---|---|---|
| `bg-white` | `bg-card` | Permukaan card, tabel, modal |
| `bg-gray-50` | `bg-background` | Latar halaman |
| `bg-gray-50` | `bg-muted/30` | Hover baris tabel, zebra striping |
| `bg-gray-100` | `bg-muted` | Chip, pembatas, latar sekunder |
| `text-gray-900` | `text-foreground` | Judul, isi utama |
| `text-gray-700` | `text-foreground` | Isi |
| `text-gray-600` | `text-muted-foreground` | Label, metadata |
| `text-gray-500` | `text-muted-foreground` | Caption, timestamp |
| `text-gray-400` | `text-muted-foreground` | Placeholder, ikon nonaktif |
| `border-gray-200` | `border-border` | Semua border |
| `border-gray-100` | `border-border` | Pembatas baris tabel |
| `border-gray-300` | `border-border` | Border input |

Plus 52 pemakaian token jembatan yang harus dibereskan supaya keduanya bisa dihapus:

| Lama | Baru | Jumlah |
|---|---|---|
| `hover:bg-primary-hover` | `hover:bg-primary/90` | 39 |
| `hover:text-primary-hover` | `hover:text-primary/90` | 5 |
| `to-primary-hover` | `to-primary/90` | 1 |
| `text-danger` | `text-destructive` | 7 |

Setelah keempatnya nol, hapus `--color-primary-hover` dan `--color-danger` dari blok `@theme`. Jangan hapus lebih awal — utility-nya akan mati senyap dan kerusakannya baru terlihat saat halaman dibuka.

### `bg-gray-50` — empat kasus, bukan dua

| Pemakaian | Jml | Jadi |
|---|---|---|
| `min-h-screen bg-gray-50` (wrapper halaman) | 34 | **Jangan disentuh** — wrapper ini dibuang di Langkah 5 |
| `hover:bg-gray-50` (baris tabel) | 37 | `hover:bg-muted/30` |
| `<thead>` / `<tr>` header | 9 | `bg-muted/30` |
| Panel sekunder `rounded-lg p-4` | ~20 | `bg-muted/30` |
| `disabled:bg-gray-50` | 3 | `disabled:bg-muted` |

Yang pertama penting: mengganti 34 wrapper itu sekarang adalah kerja sia-sia, karena seluruhnya dihapus saat shell dipasang.

`text-gray-700` vs `text-gray-600` sering dipakai bergantian tanpa maksud berbeda. Samakan ke `text-foreground` kalau isi utama, `text-muted-foreground` kalau label.

### 30 occurrence di luar peta utama

| Kelas | Jml | Jadi |
|---|---|---|
| `text-white` (di tombol `bg-primary`) | 49 | `text-primary-foreground` |
| `divide-gray-200` / `divide-gray-100` | 18 | `divide-border` |
| `bg-gray-200` (track progress) | 1 | `bg-muted` |
| `bg-gray-200`/`300` (tombol sekunder) | 5 | `bg-card border border-border`, hover `hover:bg-muted/40` |
| `text-gray-300` (pemisah titik ·) | 2 | `text-muted-foreground/50` |
| `bg-gray-100 text-gray-800` (badge netral) | 1 | `bg-muted text-muted-foreground` |
| `placeholder-gray-500` | 2 | `placeholder-muted-foreground` |
| `bg-black/40`, `bg-black/70` (scrim modal) | 2 | `bg-foreground/50` |
| Penanda jawaban soal | 2 | lihat di bawah |

**Penanda jawaban soal** — `bg-gray-300` untuk jawaban salah keliru secara semantik: abu-abu terbaca "nonaktif", bukan "salah", sehingga siswa bisa mengira soal itu tidak dijawab. Ganti jadi:

| Keadaan | Kelas |
|---|---|
| Jawaban benar | `bg-emerald-100 text-emerald-800 border border-emerald-300` |
| Pilihan siswa yang salah | `bg-red-100 text-red-800 border border-red-300` |
| Pilihan lain | `bg-muted text-muted-foreground` |

Border mengembalikan ketajaman yang hilang saat turun dari `emerald-500`, tanpa blok jenuh yang bertabrakan dengan latar cream.

**Scrim** memakai `bg-foreground/50`, bukan token baru dan bukan hitam murni — `--foreground` adalah near-black hangat yang serasi dengan palet. Drawer sidebar di Langkah 5 memakai scrim yang sama.

Kelas gray di luar semua tabel ini kemungkinan disengaja — tanyakan sebelum mengganti.

## Langkah 4 — Komponen Bersama

Bangun di `src/lib/components/` sesuai `.claude/rules/design-system.md`: `Card`, `Button`, `Badge`, `Input`, `Table`, `ProgressBar`.

Kerjakan sebelum menyentuh halaman. Sekali komponen ada, migrasi halaman jadi mengganti markup dengan komponen alih-alih menambal kelas satu per satu — dan itu memangkas sebagian besar dari 775 occurrence tadi.

Commit tiap komponen.

## Langkah 5 — Shell & Sidebar (Item Terbesar)

**Ini konstruksi baru, bukan penggantian.** Belum ada sidebar sama sekali; root layout hanya me-render children.

Karena 35 halaman memegang wrapper `min-h-screen` masing-masing, urutannya penting:

**5a. Bangun komponen shell** — `lib/components/AppShell.svelte`: sidebar 240px navy berlabel di `lg` ke atas, drawer di bawah `lg`, area konten `bg-background` dengan padding responsif. Uji sendiri dengan konten dummy.

**5b. Pasang di satu route group saja** — mulai dari `(tentor)/+layout.svelte`, yang halamannya paling sedikit. Lepas wrapper `min-h-screen` dari halaman di group itu.

**5c. Uji di tiga lebar** — 375px, 768px, 1440px. Pastikan drawer buka-tutup, konten tidak terpotong, tidak ada scroll horizontal.

**5d. Lanjut folder berikutnya** — `siswa/`, `wali/`, `kepala-guru/`. Satu folder satu commit.

Jangan pasang shell ke keempat folder sekaligus. Kalau ada yang salah di folder kedua, kamu ingin bisa revert satu commit.

## Langkah 6 — Migrasi Halaman

Urutan, dari yang paling sering dilihat:

1. Login
2. Dashboard KG
3. Master data (kelas, mapel, tahun ajaran)
4. Akun (tentor, siswa, wali)
5. Konten (materi, sub materi, module)
6. Soal & try out builder
7. Halaman siswa (belajar, latihan, ujian)
8. Halaman tentor (nilai)

Per halaman:

- Terapkan peta gray dari Langkah 3
- Ganti markup card/tabel/badge dengan komponen dari Langkah 4
- Hapus semua `shadow-*`
- Judul halaman ke `font-serif`, angka ke `font-mono`
- Tabel jadi tumpukan card di bawah `md`; form satu kolom
- Uji di 375px sebelum lanjut

**Satu halaman, satu commit.**

## Langkah 7 — Verifikasi

```powershell
(Scan "6C5DD3|5A4CC0").Count           # harus 0
(Scan "shadow-").Count                 # harus 0
(Scan "(bg|text|border)-gray-").Count  # harus mendekati 0
(Scan "(indigo|purple|violet)-").Count # harus 0
(Scan "primary-hover|text-danger").Count  # harus 0
```

Kalau baris terakhir sudah 0, hapus `--color-primary-hover` dan `--color-danger` dari `@theme`, lalu jalankan build sekali lagi untuk memastikan tidak ada yang rusak.

Checklist manual:

```
[ ] Latar halaman cream, bukan abu-abu
[ ] Tidak ada shadow
[ ] Judul halaman DM Serif Display
[ ] Nilai, persentase, timer DM Mono
[ ] Sidebar navy berlabel di desktop, drawer di HP
[ ] Checkbox presensi murid terjangkau di 375px
[ ] Timer try out tetap terlihat saat scroll di HP
[ ] Tombol minimal 44px tinggi sentuh
[ ] Tidak ada scroll horizontal di 375px pada halaman mana pun
```

---

## Aturan Selama Restyle

- **Jangan hapus file.** Restyle mengubah isi, tidak pernah menghapus. Kalau sebuah halaman terasa perlu ditulis ulang total, hentikan dan tanya.
- **Jangan ubah logika.** Hanya markup dan kelas CSS. Query, server action, validasi, otorisasi tetap. Kalau perubahan styling menuntut perubahan logika, ada yang salah — hentikan dan tanya.
- **Jangan gabungkan beberapa halaman dalam satu commit.**
- Kalau ragu antara menambal kelas atau menulis ulang komponen, pilih menambal.