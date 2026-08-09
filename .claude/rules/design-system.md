---
paths:
  - "pena_web/src/**/*.svelte"
  - "pena_web/src/lib/components/**"
  - "pena_web/tailwind.config.*"
  - "pena_web/src/app.css"
---

# Design System

Extracted from reference screenshots in `docs/design-reference/` (SaaS learning-platform style: clean cards, purple accent, pill badges, generous whitespace). Applies to every page across all phases — do not deviate per-feature.

## Color Palette

| Role | Value | Usage |
|---|---|---|
| Primary | `#6C5DD3` (indigo/purple) | Primary buttons, active nav state, links, logo mark, progress bar fill |
| Primary hover | `#5A4CC0` | Button hover state |
| Success | `#10B981` (emerald-500) | Published status, "hadir", correct answers, completion rings |
| Warning | `#F59E0B` (amber-500) | Draft status, pending review, "upgrade"-style CTAs, points/badges |
| Danger | `#EF4444` (red-500) | Delete actions, incorrect answers, belum lunas / overdue |
| Background | `#F7F7F9` (gray-50) | Page background behind cards |
| Card | `#FFFFFF` | All card surfaces |
| Border | `#E5E7EB` (gray-200) | Card borders, table dividers |
| Text primary | `#111827` (gray-900) | Headings, primary content |
| Text secondary | `#6B7280` (gray-500) | Labels, metadata, timestamps |

Configure these as Tailwind theme extensions in `tailwind.config.js` (`primary`, `success`, `warning`, `danger`) rather than hardcoding hex values in components.

## Typography

- Font: Inter (or system sans fallback) — set globally in `app.css`
- Page title: `text-2xl font-bold text-gray-900` (e.g. "Good morning, [Nama]")
- Section heading: `text-lg font-semibold text-gray-900`
- Card title: `text-base font-semibold`
- Body text: `text-sm text-gray-700`
- Metadata/caption: `text-xs text-gray-500`

## Cards

Default card wrapper for every panel, table container, and stat block:

```
bg-white rounded-2xl border border-gray-200 p-6
```

No heavy shadows — reference uses flat cards with a thin border, not `shadow-lg`. If elevation is needed (modals, dropdowns), use `shadow-sm` at most.

## Buttons

| Variant | Style | Use for |
|---|---|---|
| Primary | `bg-primary text-white rounded-lg px-4 py-2 font-medium hover:bg-primary-hover` | Publish, Simpan, Submit |
| Secondary | `bg-white border border-gray-200 rounded-lg px-4 py-2 font-medium hover:bg-gray-50` | Cancel, Preview, Export |
| Danger | `bg-white border border-red-200 text-danger rounded-lg px-4 py-2 hover:bg-red-50` | Hapus |
| Icon button | `rounded-full p-2 hover:bg-gray-100` | Overflow menu (⋮), close (×) |

Buttons use `rounded-lg` (8px), not full pill, except icon-only buttons which use `rounded-full`.

## Badges / Status Pills

Small rounded-full pills with tinted background matching text color, per reference (e.g. "Completed", "LIVE", subject tags):

```
inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium
```

| Status | Background | Text |
|---|---|---|
| Published / Selesai / Hadir | `bg-emerald-50` | `text-emerald-700` |
| Draft / Pending | `bg-amber-50` | `text-amber-700` |
| Locked / Belum | `bg-red-50` | `text-red-700` |
| Neutral (paket, tag) | `bg-gray-100` | `text-gray-700` |

Use this pattern for: content status (draft/published), `paket` badge (regular/privat), presensi status, KPI status.

## Tables

- No heavy borders — thin `border-b border-gray-100` between rows only
- Row hover: `hover:bg-gray-50`
- Avatar + name + subtext pattern for people rows (tentor, siswa, wali lists): circular avatar (initials fallback), name bold, role/detail as `text-xs text-gray-500` beneath
- Numeric/status columns right-aligned or centered with icon (✓ green / ✗ red) rather than plain text where applicable

## Data Visualization

Two patterns appear repeatedly in the reference and map directly to Pena's KPI and progress features:

- **Circular progress ring** (donut, single value) — for individual percentages: KPI score, kelengkapan jurnal, accuracy. Primary color fill, gray track.
- **Segmented gauge** (semi-circle, multi-category) — for breakdowns with several categories: e.g. distribusi status siswa (passed/failed/in-progress). Use distinct colors per segment from the palette above.

For Wali dashboard bar charts (nilai kronologis), use simple bar charts, not the ring/gauge pattern — bars suit a timeline of scores better.

## Layout Shell

- Sidebar: icon-only, fixed width ~64px, white or near-white background, active item gets `bg-primary/10 text-primary` highlight, collapsible via top toggle icon
- Main content: `max-w-[1200px] mx-auto p-8` inside the gray-50 background
- Top-right utility area (search, notifications, avatar) stays consistent across all dashboards (KG, Tentor, Siswa, Wali)

## Mapping to Pena Screens

| Reference screenshot | Maps to |
|---|---|
| Siswa_Dashboard | `(siswa)/` home — greeting header, in-progress content cards, stat cards top-right |
| Tentor_Dashboard / KG_Dashboard | `(kepala-guru)/overview/` — stat cards, to-do/ringkasan list, table of pending items (jurnal belum direview → "Ungraded Quiz" pattern) |
| Modul_page | `(kepala-guru)/konten/.../module` — content detail panel, trainer/assignee-style list adapted for tentor assignment |
| Create_Try_Out_or_Quiz | `(kepala-guru)/konten/.../try-out` builder — question list sidebar + editor panel (Phase 2) |
| Score | `(kepala-guru)/monitoring/nilai` or siswa's try out review — question-by-question breakdown with stats panel |
| Report | Export/rekap tables (Phase 5) — dense data table with per-question pass/fail icons |

## Rules

- Every new page checks this file before styling — no ad-hoc color values outside the palette above.
- Icons: use `lucide-svelte` (matches the line-icon style seen throughout reference — sidebar icons, info icons, chevrons).
- Empty states get a simple centered message, not decorative illustration (the reference's colorful 3D illustrations are out of scope — too much effort for an internal tool; solid color placeholder or icon is enough).
