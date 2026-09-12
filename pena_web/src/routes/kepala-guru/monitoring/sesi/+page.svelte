<script lang="ts">
  import { goto } from '$app/navigation'
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'

  let { data } = $props()

  let tanggal = $state(data.filter.tanggal)

  function terapkan() {
    goto(`/kepala-guru/monitoring/sesi${tanggal ? `?tanggal=${tanggal}` : ''}`, { keepFocus: true, noScroll: true })
  }

  function waktu(iso: string | null) {
    return iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
  }
</script>

<svelte:head>
  <title>Monitoring Sesi · Pena</title>
</svelte:head>

<h1 class="font-serif text-2xl text-foreground">Monitoring Sesi</h1>
<p class="mt-1 text-sm text-muted-foreground">Ringkasan sesi yang sudah diselesaikan.</p>

<Card class="mt-6">
  <div class="flex flex-wrap items-end gap-3">
    <div>
      <label for="tanggal" class="block text-sm font-medium text-foreground">Tanggal</label>
      <input
        id="tanggal"
        type="date"
        bind:value={tanggal}
        class="mt-1 rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
      />
    </div>
    <Button onclick={terapkan}>Terapkan</Button>
    <Button
      variant="secondary"
      onclick={() => {
        tanggal = ''
        goto('/kepala-guru/monitoring/sesi')
      }}
    >
      Reset
    </Button>
  </div>
</Card>

<div class="mt-6 space-y-4">
  {#if data.sesi.length === 0}
    <Card class="p-8 text-center">
      <p class="text-sm text-muted-foreground">Belum ada sesi selesai untuk filter ini.</p>
    </Card>
  {:else}
    {#each data.sesi as s (s.id)}
      <Card>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="font-serif text-base text-foreground">{s.tentorNama}</h2>
            <p class="mt-1 text-sm text-muted-foreground">{s.kelasNama} · {s.mapelNama}</p>
          </div>
          <Badge tone="success">Selesai</Badge>
        </div>

        <div class="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p class="text-xs font-medium text-muted-foreground">Presensi tentor</p>
            {#if s.fotoUrl}
              <img
                src={s.fotoUrl}
                alt="Presensi {s.tentorNama}"
                class="mt-2 h-24 w-24 rounded-lg border border-border object-cover"
              />
            {:else}
              <p class="mt-2 text-sm text-muted-foreground">—</p>
            {/if}
            <p class="mt-2 text-xs text-muted-foreground">
              Unggah <span class="font-mono">{waktu(s.uploadedAt)}</span>
            </p>
          </div>

          <div>
            <p class="text-xs font-medium text-muted-foreground">Kehadiran murid</p>
            <p class="mt-2 font-mono text-2xl text-foreground">
              {s.hadir}<span class="text-base text-muted-foreground">/{s.totalMurid}</span>
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              {s.totalMurid === 0 ? 'Presensi murid belum diisi' : 'hadir dari total'}
            </p>
          </div>

          <div>
            <p class="text-xs font-medium text-muted-foreground">Waktu</p>
            <p class="mt-2 text-xs text-foreground">
              Mulai <span class="font-mono">{waktu(s.startedAt)}</span>
            </p>
            <p class="mt-1 text-xs text-foreground">
              Selesai <span class="font-mono">{waktu(s.endedAt)}</span>
            </p>
          </div>
        </div>

        <div class="mt-4 rounded-lg bg-muted/30 p-4">
          <p class="text-xs font-medium text-muted-foreground">Jurnal</p>
          {#if s.jurnal}
            <p class="mt-1 text-sm font-medium text-foreground">{s.jurnal.materiNama}</p>
            <p class="mt-1 whitespace-pre-wrap text-sm text-foreground">{s.jurnal.deskripsi}</p>
          {:else}
            <p class="mt-1 text-sm text-muted-foreground">Tidak ada jurnal</p>
          {/if}
        </div>

        {#if s.nilaiManual.length > 0}
          <div class="mt-4">
            <p class="text-xs font-medium text-muted-foreground">Nilai manual hari itu</p>
            <div class="mt-2 flex flex-wrap gap-2">
              {#each s.nilaiManual as n (n.id)}
                <span
                  class="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                >
                  {n.judul} · <span class="font-mono">{n.nilai}</span>
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </Card>
    {/each}
  {/if}
</div>
