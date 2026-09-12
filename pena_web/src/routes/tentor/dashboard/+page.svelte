<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { closeSesi } from '$features/session/data/close-sesi'
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import { Camera, ClipboardCheck, NotebookPen, PencilLine, BookOpen } from 'lucide-svelte'

  let { data } = $props()

  let menutup = $state(false)
  let konfirmasi = $state(false)
  let error = $state('')

  let sapaan = $derived.by(() => {
    const jam = new Date().getHours()
    if (jam < 11) return 'Selamat pagi'
    if (jam < 15) return 'Selamat siang'
    if (jam < 18) return 'Selamat sore'
    return 'Selamat malam'
  })

  const menu = [
    { label: 'Presensi Diri', ikon: Camera, href: '/tentor/presensi/diri' },
    { label: 'Presensi Murid', ikon: ClipboardCheck, href: '/tentor/presensi/murid' },
    { label: 'Jurnal Mengajar', ikon: NotebookPen, href: '/tentor/jurnal' },
    { label: 'Input Nilai', ikon: PencilLine, href: '/tentor/nilai' },
    { label: 'Lihat Modul', ikon: BookOpen, href: '/tentor/modul' }
  ]

  async function selesaikan() {
    if (!data.sesiAktif) return
    menutup = true
    error = ''
    try {
      await closeSesi(data.sesiAktif.id)
      konfirmasi = false
      await invalidateAll()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal menyelesaikan sesi'
      konfirmasi = false
    } finally {
      menutup = false
    }
  }

  function jam(iso: string) {
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }
</script>

<div class="mb-8">
  <h1 class="font-serif text-2xl text-foreground">{sapaan}, {data.user.nama_lengkap}</h1>
  <p class="mt-1 text-sm text-muted-foreground">Dashboard Tentor</p>
</div>

{#if error}
  <div class="mb-4 rounded-lg bg-red-100 p-4"><p class="text-sm text-red-800">{error}</p></div>
{/if}

<!-- Relief hari ini ditaruh paling atas: pengganti perlu melihatnya sebelum
     apa pun, dan izinnya habis lewat tengah malam. -->
{#each data.reliefUntukSaya as r (r.id)}
  <Card class="mb-6 border-l-2 border-l-accent">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <Badge tone="info">Relief hari ini</Badge>
        <h2 class="mt-2 font-serif text-base text-foreground">{r.kelasNama} · {r.mapelNama}</h2>
        <p class="mt-1 text-sm text-muted-foreground">Menggantikan {r.tentorAsliNama}</p>
      </div>
      <Button href="/tentor/presensi/diri">Mulai Sesi Relief</Button>
    </div>

    <div class="mt-3 rounded-lg bg-muted/30 p-3">
      <p class="text-xs font-medium text-muted-foreground">Task delegasi</p>
      <p class="mt-1 whitespace-pre-wrap text-sm text-foreground">{r.task}</p>
    </div>
  </Card>
{/each}

{#if data.sesiAktif}
  <Card class="mb-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Badge tone="success">Sedang berjalan</Badge>
        <h2 class="mt-2 font-serif text-base text-foreground">
          {data.sesiAktif.kelasNama} · {data.sesiAktif.mapelNama}
        </h2>
        <p class="mt-1 text-xs text-muted-foreground">
          Dimulai <span class="font-mono">{jam(data.sesiAktif.startedAt)}</span>
        </p>
      </div>
      <Button onclick={() => (konfirmasi = true)} disabled={!data.sesiAktif.adaJurnal || menutup}>
        Selesai Mengajar
      </Button>
    </div>
    {#if !data.sesiAktif.adaJurnal}
      <p class="mt-3 text-sm text-muted-foreground">
        Isi <a href="/tentor/jurnal" class="font-medium text-primary hover:underline">jurnal mengajar</a>
        dulu sebelum menyelesaikan sesi.
      </p>
    {/if}
  </Card>
{:else}
  <Card class="mb-6">
    <h2 class="font-serif text-base text-foreground">Belum ada sesi berjalan</h2>
    <p class="mt-1 text-sm text-muted-foreground">
      Mulai dengan mengunggah foto presensi diri — itu yang membuka sesi.
    </p>
    <Button href="/tentor/presensi/diri" class="mt-4">Mulai Sesi</Button>
  </Card>
{/if}

{#if data.selesaiHariIni.length > 0}
  <Card class="mb-6">
    <h2 class="mb-3 font-serif text-base text-foreground">Selesai hari ini</h2>
    <div class="divide-y divide-border">
      {#each data.selesaiHariIni as s (s.id)}
        <div class="flex items-center justify-between gap-3 py-2">
          <span class="text-sm text-foreground">{s.kelasNama} · {s.mapelNama}</span>
          <Badge tone="success">
            Selesai <span class="font-mono">{s.endedAt ? jam(s.endedAt) : ''}</span>
          </Badge>
        </div>
      {/each}
    </div>
  </Card>
{/if}

<Card>
  <h2 class="mb-4 font-serif text-lg text-foreground">Menu</h2>
  <div class="grid gap-2 sm:grid-cols-2">
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

<!-- Langkah 14: konfirmasi wajib sebelum sesi dikunci -->
{#if konfirmasi}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
    <div class="w-full max-w-sm rounded-xl border border-border bg-card p-5">
      <h3 class="font-serif text-base text-foreground">Yakin selesai mengajar?</h3>
      <p class="mt-2 text-sm text-muted-foreground">
        Presensi dan jurnal akan dikunci. Sesi yang sudah ditutup tidak bisa dibuka lagi.
      </p>
      <div class="mt-6 flex gap-3">
        <Button onclick={selesaikan} disabled={menutup} class="flex-1">
          {menutup ? 'Memproses...' : 'Ya, Selesai'}
        </Button>
        <Button variant="secondary" onclick={() => (konfirmasi = false)} disabled={menutup} class="flex-1">
          Batal
        </Button>
      </div>
    </div>
  </div>
{/if}
