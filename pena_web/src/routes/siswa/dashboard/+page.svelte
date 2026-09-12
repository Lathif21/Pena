<script lang="ts">
  import Card from '$lib/components/Card.svelte'
  import { BookOpen } from 'lucide-svelte'

  let { data } = $props()

  let sapaan = $derived.by(() => {
    const jam = new Date().getHours()
    if (jam < 11) return 'Selamat pagi'
    if (jam < 15) return 'Selamat siang'
    if (jam < 18) return 'Selamat sore'
    return 'Selamat malam'
  })
</script>

<div class="mb-8">
  <h1 class="font-serif text-2xl text-foreground">{sapaan}, {data.profile.nama_lengkap}</h1>
  <p class="mt-1 text-sm text-muted-foreground">Dashboard Siswa</p>
</div>

<Card>
  <h2 class="mb-4 font-serif text-lg text-foreground">Pembelajaran</h2>
  <a
    href="/siswa/mapel"
    class="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/40"
  >
    <BookOpen class="h-4 w-4 shrink-0 text-muted-foreground" />
    Mata Pelajaran &amp; Modul
  </a>
</Card>
