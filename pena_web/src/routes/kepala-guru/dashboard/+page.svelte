<script lang="ts">
  import Badge from '$lib/components/Badge.svelte'
  import Card from '$lib/components/Card.svelte'
  import ProgressBar from '$lib/components/ProgressBar.svelte'
  import { kpiContoh } from '$features/kpi/data/kpi-contoh'
  import {
    Users,
    GraduationCap,
    BookOpen,
    NotebookPen,
    CalendarRange,
    UserRoundCog,
    Puzzle,
    RotateCcw,
    ClipboardList,
    Presentation,
    Camera
  } from 'lucide-svelte'

  let { data } = $props()

  let sapaan = $derived.by(() => {
    const jam = new Date().getHours()
    if (jam < 11) return 'Selamat pagi'
    if (jam < 15) return 'Selamat siang'
    if (jam < 18) return 'Selamat sore'
    return 'Selamat malam'
  })

  const hariIni = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const tanggalPendek = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  // $derived, bukan const: data ikut berubah setelah invalidate, dan const
  // hanya memotret nilai saat komponen dibuat.
  let angka = $derived([
    {
      label: 'Total Siswa',
      nilai: data.stats.siswa,
      catatan: `${data.stats.kelas} kelas aktif`,
      ikon: Users,
      href: '/kepala-guru/akun/siswa'
    },
    {
      label: 'Tentor Aktif',
      nilai: data.stats.tentor,
      catatan: `Hadir hari ini: ${data.absensiHariIni.filter((s) => s.adaFoto).length}`,
      ikon: GraduationCap,
      href: '/kepala-guru/akun/tentor'
    },
    {
      label: 'Mata Pelajaran',
      nilai: data.stats.mapel,
      catatan: `${data.stats.materi} materi tersedia`,
      ikon: BookOpen,
      href: '/kepala-guru/master-data/mapel'
    },
    {
      label: 'Jurnal Hari Ini',
      nilai: data.jurnalHariIni,
      catatan: `dari ${data.absensiHariIni.length} sesi`,
      ikon: NotebookPen,
      href: '/kepala-guru/monitoring/jurnal'
    }
  ])

  const menu = [
    { label: 'Tahun Ajaran', ikon: CalendarRange, href: '/kepala-guru/master-data/tahun-ajaran' },
    { label: 'Akun Wali Murid', ikon: UserRoundCog, href: '/kepala-guru/akun/wali' },
    { label: 'Assignment Tentor', ikon: Puzzle, href: '/kepala-guru/assignment' },
    { label: 'Monitoring Sesi', ikon: ClipboardList, href: '/kepala-guru/monitoring/sesi' },
    { label: 'Reset Attempt Try Out', ikon: RotateCcw, href: '/kepala-guru/monitoring/attempt' },
    { label: 'Dashboard Tentor', ikon: Presentation, href: '/tentor/dashboard' }
  ]

  function jam(iso: string | null) {
    return iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''
  }

  function tanggal(iso: string | null) {
    return iso
      ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—'
  }
</script>

<div class="mb-8 flex flex-wrap items-baseline justify-between gap-2">
  <h1 class="font-serif text-3xl text-foreground">{sapaan}, {data.profile.nama_lengkap}</h1>
  <p class="text-sm text-muted-foreground">{hariIni}</p>
</div>

<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {#each angka as a (a.href)}
    <a href={a.href} class="block rounded-xl border border-border bg-card p-5 hover:bg-muted/40">
      <span
        class="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
      >
        <a.ikon class="h-5 w-5" />
      </span>
      <p class="mt-3 font-mono text-3xl text-foreground">{a.nilai}</p>
      <p class="text-sm font-medium text-foreground">{a.label}</p>
      <p class="mt-1 text-xs text-muted-foreground">{a.catatan}</p>
    </a>
  {/each}
</div>

<div class="mb-6 grid gap-6 lg:grid-cols-2">
  <Card>
    <div class="mb-4 flex items-baseline justify-between gap-3 border-l-2 border-accent pl-3">
      <h2 class="font-serif text-lg text-foreground">Absensi Tentor — {tanggalPendek}</h2>
      <a href="/kepala-guru/monitoring/presensi" class="text-xs font-medium text-primary hover:underline">
        Lihat semua
      </a>
    </div>

    {#if data.absensiHariIni.length === 0}
      <div class="py-8 text-center">
        <Camera class="mx-auto h-8 w-8 text-muted-foreground" />
        <p class="mt-2 text-sm text-muted-foreground">Belum ada sesi hari ini.</p>
      </div>
    {:else}
      <div class="divide-y divide-border">
        {#each data.absensiHariIni as s (s.id)}
          <div class="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p class="text-sm font-medium text-foreground">{s.tentorNama}</p>
              <p class="text-xs text-muted-foreground">
                {s.kelasNama} · <span class="font-mono">{jam(s.startedAt)}</span>{#if s.endedAt}<span
                    class="font-mono">–{jam(s.endedAt)}</span
                  >{/if}
              </p>
            </div>
            <div class="flex items-center gap-2">
              {#if s.adaFoto}
                <Badge tone="success">Foto ✓</Badge>
              {/if}
              <Badge tone={s.status === 'closed' ? 'success' : 'info'}>
                {s.status === 'closed' ? 'Selesai' : 'Berjalan'}
              </Badge>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Card>

  <Card>
    <div class="mb-4 flex items-baseline justify-between gap-3 border-l-2 border-accent pl-3">
      <h2 class="font-serif text-lg text-foreground">Jurnal Terbaru</h2>
      <a href="/kepala-guru/monitoring/jurnal" class="text-xs font-medium text-primary hover:underline">
        Lihat semua
      </a>
    </div>

    {#if data.jurnalTerbaru.length === 0}
      <div class="py-8 text-center">
        <NotebookPen class="mx-auto h-8 w-8 text-muted-foreground" />
        <p class="mt-2 text-sm text-muted-foreground">Belum ada jurnal yang disubmit.</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each data.jurnalTerbaru as j (j.id)}
          <div class="rounded-lg bg-muted/30 p-4">
            <div class="flex items-baseline justify-between gap-3">
              <p class="text-sm font-medium text-foreground">{j.tentorNama}</p>
              <p class="font-mono text-xs text-muted-foreground">{tanggal(j.submittedAt)}</p>
            </div>
            <p class="mt-1 text-xs text-muted-foreground">
              {j.kelasNama} · {j.mapelNama} · {j.materiNama}
            </p>
            <p class="mt-2 line-clamp-3 text-sm text-foreground">{j.deskripsi}</p>
          </div>
        {/each}
      </div>
    {/if}
  </Card>
</div>

<div class="mb-6 grid gap-6 lg:grid-cols-2">
  <Card>
    <div class="mb-4 flex items-baseline justify-between gap-3 border-l-2 border-accent pl-3">
      <h2 class="font-serif text-lg text-foreground">Overview Nilai Siswa</h2>
      <a href="/kepala-guru/monitoring/nilai" class="text-xs font-medium text-primary hover:underline">
        Lihat semua
      </a>
    </div>

    {#if data.nilai.jumlah === 0}
      <div class="py-8 text-center">
        <GraduationCap class="mx-auto h-8 w-8 text-muted-foreground" />
        <p class="mt-2 text-sm text-muted-foreground">Belum ada nilai yang masuk.</p>
      </div>
    {:else}
      <div>
        <div class="flex items-baseline justify-between gap-3 text-sm">
          <span class="text-foreground">Rata-rata seluruh siswa</span>
          <span class="font-mono text-2xl text-foreground">{data.nilai.rata}</span>
        </div>
        <ProgressBar value={data.nilai.rata ?? 0} showLabel={false} class="mt-2" />
      </div>

      <dl class="mt-4 grid grid-cols-2 gap-4">
        <div class="rounded-lg bg-muted/30 p-4">
          <dt class="text-xs text-muted-foreground">Nilai tercatat</dt>
          <dd class="mt-1 font-mono text-xl text-foreground">{data.nilai.jumlah}</dd>
        </div>
        <div class="rounded-lg bg-muted/30 p-4">
          <dt class="text-xs text-muted-foreground">Di bawah 70</dt>
          <dd class="mt-1 font-mono text-xl text-foreground">{data.nilai.diBawahAmbang}</dd>
        </div>
      </dl>
      <p class="mt-3 text-xs text-muted-foreground">
        Dari try out dan nilai manual. Latihan soal tidak dihitung.
      </p>
    {/if}
  </Card>

  <Card>
    <div class="mb-2 flex items-baseline justify-between gap-3 border-l-2 border-accent pl-3">
      <h2 class="font-serif text-lg text-foreground">KPI Tentor</h2>
      <Badge tone="pending">Data contoh</Badge>
    </div>
    <p class="mb-4 text-xs text-muted-foreground">
      Angka di bawah ini belum dihitung dari data asli — nama pun fiktif. Perhitungan KPI
      sesungguhnya masuk di Fase 5.
    </p>

    <div class="space-y-3">
      {#each kpiContoh as k (k.nama)}
        <div>
          <div class="flex items-baseline justify-between gap-3 text-sm">
            <span class="text-foreground">{k.nama}</span>
            <span class="font-mono text-xs text-muted-foreground">
              hadir {k.kehadiran}% · jurnal {k.jurnal}% · nilai {k.rataNilaiSiswa}
            </span>
          </div>
          <ProgressBar value={k.skor} />
        </div>
      {/each}
    </div>
  </Card>
</div>

<Card>
  <h2 class="mb-4 font-serif text-lg text-foreground">Menu</h2>
  <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
    {#each menu as m (m.href)}
      <a
        href={m.href}
        class="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/40"
      >
        <m.ikon class="h-4 w-4 shrink-0 text-muted-foreground" />
        {m.label}
      </a>
    {/each}
  </div>
</Card>
