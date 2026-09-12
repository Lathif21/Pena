<script lang="ts">
  import { goto } from '$app/navigation'
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'

  let { data } = $props()

  let tanggal = $state(data.filter.tanggal)
  let tentorId = $state(data.filter.tentorId)

  function terapkan() {
    const p = new URLSearchParams()
    if (tanggal) p.set('tanggal', tanggal)
    if (tentorId) p.set('tentor', tentorId)
    goto(`/kepala-guru/monitoring/jurnal${p.toString() ? `?${p}` : ''}`, { keepFocus: true, noScroll: true })
  }

  function reset() {
    tanggal = ''
    tentorId = ''
    goto('/kepala-guru/monitoring/jurnal', { keepFocus: true, noScroll: true })
  }

  function tanggalPanjang(iso: string | null) {
    return iso ? new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'full' }) : '—'
  }

  const gayaField =
    'mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none'
</script>

<svelte:head>
  <title>Monitoring Jurnal · Pena</title>
</svelte:head>

<h1 class="font-serif text-2xl text-foreground">Monitoring Jurnal Mengajar</h1>
<p class="mt-1 text-sm text-muted-foreground">
  Sistem mencatat, Kepala Guru menilai sendiri. Tidak ada tombol setujui atau tolak di sini.
</p>

<Card class="mt-6">
  <div class="grid gap-4 sm:grid-cols-3">
    <div>
      <label for="tanggal" class="block text-sm font-medium text-foreground">Tanggal sesi</label>
      <input id="tanggal" type="date" bind:value={tanggal} class={gayaField} />
    </div>
    <div>
      <label for="tentor" class="block text-sm font-medium text-foreground">Tentor</label>
      <select id="tentor" bind:value={tentorId} class="{gayaField} pr-8">
        <option value="">Semua tentor</option>
        {#each data.tentor as t (t.id)}
          <option value={t.id}>{t.nama_lengkap}</option>
        {/each}
      </select>
    </div>
    <div class="flex items-end gap-2">
      <Button onclick={terapkan}>Terapkan</Button>
      <Button variant="secondary" onclick={reset}>Reset</Button>
    </div>
  </div>
</Card>

<div class="mt-6 space-y-4">
  {#if data.jurnal.length === 0}
    <Card class="p-8 text-center">
      <p class="text-sm text-muted-foreground">
        Belum ada jurnal yang disubmit untuk filter ini.
      </p>
    </Card>
  {:else}
    {#each data.jurnal as j (j.id)}
      <Card>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="font-serif text-base text-foreground">{j.tentorNama}</h2>
            <p class="mt-1 text-sm text-muted-foreground">{j.kelasNama} · {j.mapelNama}</p>
            <p class="mt-1 text-xs text-muted-foreground">{tanggalPanjang(j.tanggalSesi)}</p>
          </div>
          <Badge tone="success">Submitted</Badge>
        </div>

        <div class="mt-4 rounded-lg bg-muted/30 p-4">
          <p class="text-xs font-medium text-muted-foreground">Materi</p>
          <p class="mt-1 text-sm text-foreground">{j.materiNama}</p>
          <p class="mt-3 text-xs font-medium text-muted-foreground">Deskripsi</p>
          <p class="mt-1 whitespace-pre-wrap text-sm text-foreground">{j.deskripsi}</p>
        </div>
      </Card>
    {/each}
  {/if}
</div>
