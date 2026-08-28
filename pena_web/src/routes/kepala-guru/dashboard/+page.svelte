<script lang="ts">
  import Card from '$lib/components/Card.svelte'
  import {
    BookOpen,
    Users,
    GraduationCap,
    School,
    CalendarRange,
    UserRoundCog,
    Puzzle,
    RotateCcw,
    ClipboardList,
    Presentation
  } from 'lucide-svelte'

  let { data } = $props()

  const angka = [
    { label: 'Mata Pelajaran', nilai: data.stats.mapel, href: '/kepala-guru/master-data/mapel' },
    { label: 'Kelas', nilai: data.stats.kelas, href: '/kepala-guru/master-data/kelas' },
    { label: 'Siswa', nilai: data.stats.siswa, href: '/kepala-guru/akun/siswa' },
    { label: 'Tentor', nilai: data.stats.tentor, href: '/kepala-guru/akun/tentor' }
  ]

  // Yang tidak masuk daftar nav sidebar dijangkau dari sini.
  const menu = [
    { label: 'Kelola Konten', ikon: BookOpen, href: '/kepala-guru/konten' },
    { label: 'Tahun Ajaran', ikon: CalendarRange, href: '/kepala-guru/master-data/tahun-ajaran' },
    { label: 'Akun Wali Murid', ikon: UserRoundCog, href: '/kepala-guru/akun/wali' },
    { label: 'Assignment Tentor', ikon: Puzzle, href: '/kepala-guru/assignment' },
    { label: 'Sesi Mengajar', ikon: ClipboardList, href: '/kepala-guru/monitoring/sesi' },
    { label: 'Reset Attempt Try Out', ikon: RotateCcw, href: '/kepala-guru/monitoring/attempt' },
    { label: 'Dashboard Tentor', ikon: Presentation, href: '/tentor/dashboard' }
  ]

  const ikonAngka = [BookOpen, School, GraduationCap, Users]
</script>

<div class="mb-8">
  <h1 class="font-serif text-3xl text-foreground">Dashboard Kepala Guru</h1>
  <p class="mt-1 text-sm text-muted-foreground">Selamat datang, {data.profile.nama_lengkap}</p>
</div>

<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {#each angka as a, i (a.href)}
    {@const Ikon = ikonAngka[i]}
    <a href={a.href} class="block rounded-xl border border-border bg-card p-5 hover:bg-muted/40">
      <span class="flex items-center gap-2 text-sm text-muted-foreground">
        <Ikon class="h-4 w-4" />
        {a.label}
      </span>
      <!-- Angka selalu DM Mono. -->
      <p class="mt-2 font-mono text-3xl text-foreground">{a.nilai}</p>
    </a>
  {/each}
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
