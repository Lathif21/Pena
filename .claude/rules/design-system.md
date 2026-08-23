---
paths:
  - "pena_web/src/**/*.svelte"
  - "pena_web/src/lib/components/**"
  - "pena_web/tailwind.config.*"
  - "pena_web/src/app.css"
---

# Design System

Derived from the approved Figma export. This **replaces** the earlier purple/SaaS direction — do not mix the two.

Character: warm, academic, calm. Cream background, deep navy chrome, gold accents.

## Color Tokens

Declare as CSS variables in `app.css`, map in `tailwind.config.js`. Never hardcode hex in components.

```css
:root {
  --background: #F5F3EF;        /* warm cream page background */
  --foreground: #1A1714;
  --card: #FFFFFF;
  --primary: #1E3A5F;           /* deep navy — buttons, active states */
  --primary-foreground: #FFFFFF;
  --secondary: #EDF3F8;
  --secondary-foreground: #1E3A5F;
  --muted: #E4E0D8;
  --muted-foreground: #716860;
  --accent: #C17F2E;            /* gold — highlights, active nav marker */
  --accent-foreground: #FFFFFF;
  --destructive: #C0392B;
  --border: rgba(26, 23, 20, 0.1);
  --input-background: #EDEAE4;
  --ring: #1E3A5F;

  --sidebar: #1E3A5F;
  --sidebar-foreground: #F5F3EF;
  --sidebar-accent: #264D73;
  --sidebar-border: rgba(245, 243, 239, 0.12);

  --chart-1: #1E3A5F;  /* navy */
  --chart-2: #C17F2E;  /* gold */
  --chart-3: #2E7D52;  /* green */
  --chart-4: #8B4513;  /* brown */
  --chart-5: #5B2C6F;  /* plum */

  --radius: 0.5rem;    /* 8px */
}
```

Dark mode tokens exist in the export but are **out of scope** — light mode only.

## Typography

| Family | Job |
|---|---|
| **DM Serif Display** | Product name, page titles, section headings. Carries the academic character — do not substitute. |
| **Plus Jakarta Sans** | Body, labels, buttons, table content. Default sans. |
| **DM Mono** | Numbers read as data: scores, percentages, KPI figures, timers, counts. |

Mono for figures keeps digits aligned and scannable in tables. Apply consistently.

## Responsive

The app must work on phone, tablet, and desktop. Breakpoints: `sm` 640, `md` 768, `lg` 1024.

**Mobile-first flows.** Two flows are used on a phone by default and must be designed for it first, not adapted after:

- **Presensi tentor** — the photo comes from Timestamp Camera Free, a phone app. A tentor will always be on their phone here. Use `<input type="file" accept="image/*">` so the gallery opens natively; do not build a drag-and-drop zone as the primary control.
- **Presensi murid** — filled in class, on a phone, right after.

Everything else (content building, grade entry, KG monitoring) is desktop-primary but must remain usable on tablet.

**Sidebar.** Fixed 240px from `lg` up. Below `lg`, it becomes an off-canvas drawer: hamburger in a sticky top bar, drawer slides from the left over a scrim, closes on navigate and on scrim tap. Same navy styling in both modes.

**Tables.** Below `md`, a table with more than three meaningful columns becomes a stack of cards: primary value as the card heading, remaining fields as label/value rows. Do not rely on horizontal scroll for data the user must act on — a checkbox or button pushed off-screen is unreachable in practice.

**Forms.** Single column below `md`. Inputs full width. Labels above fields, never beside.

**Charts.** Below `md`, reduce to one chart per row and drop legends in favour of direct labels. Wali murid's per-subject chart may scroll horizontally when there are many exams — that is data to read, not to act on, so scrolling is acceptable here.

**Touch targets.** Minimum 44×44px for anything tappable. The default `px-4 py-2.5` button clears this; icon-only buttons need explicit `p-2.5` or larger.

**Try out on mobile.** The countdown timer stays visible while scrolling — sticky top bar with the timer and answered-count. One question per screen below `md`; the whole set may scroll on desktop. Never let the submit button scroll out of reach.

## Layout Shell

Sidebar (`lg` and up): 240px, navy, labelled.

- Logo in DM Serif Display at top
- Nav items: icon + label, `rounded-lg px-3 py-2.5`
- Active: `bg-sidebar-accent`, semibold, `border-r-2 border-accent` gold marker
- Inactive: `text-sidebar-foreground/70`, hover lightens
- Bottom: avatar, name, role title, logout

Main content on cream; cards in white on top. Content max width ~1200px, `p-4` on mobile rising to `p-8` on desktop.

## Navigation Per Role

| Role | Items |
|---|---|
| Kepala Guru | Beranda, Manajemen Akun, Konten & Kurikulum, Absensi Tentor, Jurnal Mengajar, KPI Tentor |
| Tentor | Beranda, Absensi Saya, Absensi Siswa, Input Nilai, Jurnal Mengajar |
| Siswa | Beranda, Belajar, Latihan Soal, Ujian, Nilai Saya |
| Wali Murid | Beranda, Progress Nilai, Absensi Anak |

Icons from `lucide-svelte`.

## Components

Build these **hand-rolled in `lib/components/`** with Tailwind. The design uses plain cards, tables, badges, and inputs — all trivial, and a component library would add dependencies for no gain. Reach for `shadcn-svelte` only if a genuinely complex widget appears (date picker, combobox).

**Cards:** `bg-card border border-border rounded-xl p-5`. No shadows.

**Buttons:** `rounded-lg px-4 py-2.5`.
- Primary: `bg-primary text-primary-foreground`
- Secondary: `bg-card border border-border`
- Destructive: `text-destructive border border-border`

**Inputs:** `bg-input-background rounded-lg px-3 py-2.5`, transparent border, `ring` on focus.

**Tables:** `border-b border-border` between rows, `px-4 py-3` cells, header `text-xs uppercase tracking-wide text-muted-foreground`. Numeric columns in DM Mono. See Responsive for the mobile card-stack rule.

**Status badges:** `rounded-full px-2.5 py-1 text-xs font-medium`, tinted background.

| Meaning | Classes |
|---|---|
| Hadir / published / success | `bg-emerald-100 text-emerald-800` |
| Draft / pending | `bg-amber-100 text-amber-800` |
| Informational | `bg-blue-100 text-blue-800` |
| Tidak hadir / locked / error | `bg-red-100 text-red-800` |

**Attendance is two-state for now:** hadir and tidak hadir. The Figma export shows four (hadir / sakit / izin / alpha) — that is a future extension, not current scope. Do not add the extra states to the schema or UI until asked; the amber and blue badge styles above stay available for other uses.

**Progress bars:** `h-1.5 rounded-full bg-primary` on a `bg-muted` track, percentage beside it in DM Mono.

**Charts:** LayerChart or Chart.js with `--chart-1..5` in order. Navy first, gold second.

## Rules

- No color outside the tokens above.
- No `shadow-*`. Depth comes from cream/white contrast.
- Headings DM Serif Display, figures DM Mono, everything else Plus Jakarta Sans.
- Empty states: centered text plus an icon, no illustrations.
