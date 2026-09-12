<script lang="ts">
  import { goto } from '$app/navigation'
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import Table from '$lib/components/Table.svelte'
  import Th from '$lib/components/Th.svelte'
  import Td from '$lib/components/Td.svelte'
  import { X } from 'lucide-svelte'

  let { data } = $props()

  let tanggal = $state(data.filter.tanggal)
  let tentorId = $state(data.filter.tentorId)
  let fotoBesar = $state<{ url: string; judul: string } | null>(null)

  function terapkan() {
    const p = new URLSearchParams()
    if (tanggal) p.set('tanggal', tanggal)
    if (tentorId) p.set('tentor', tentorId)
    goto(`/kepala-guru/monitoring/presensi${p.toString() ? `?${p}` : ''}`, { keepFocus: true, noScroll: true })
  }

  function reset() {
    tanggal = ''
    tentorId = ''
    goto('/kepala-guru/monitoring/presensi', { keepFocus: true, noScroll: true })
  }

  function waktu(iso: string) {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const gayaField =
    'mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none'
</script>

<svelte:head>
  <title>Monitoring Presensi Tentor · Pena</title>
</svelte:head>

<h1 class="font-serif text-2xl text-foreground">Monitoring Presensi Tentor</h1>
<p class="mt-1 text-sm text-muted-foreground">
  Foto dari Timestamp Camera memuat waktu dan lokasi. Bandingkan dengan waktu unggah sistem.
</p>

<Card class="mt-6">
  <div class="grid gap-4 sm:grid-cols-3">
    <div>
      <label for="tanggal" class="block text-sm font-medium text-foreground">Tanggal</label>
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

{#if data.sesi.length === 0}
  <Card class="mt-6 p-8 text-center">
    <p class="text-sm text-muted-foreground">Tidak ada presensi untuk filter ini.</p>
  </Card>
{:else}
  <!-- Enam kolom bermakna — di bawah md jadi tumpukan card, sesuai design-system.md. -->
  <div class="mt-6 space-y-3 md:hidden">
    {#each data.sesi as s (s.id)}
      <Card>
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-medium text-foreground">{s.tentorNama}</p>
            <p class="text-sm text-muted-foreground">{s.kelasNama} · {s.mapelNama}</p>
          </div>
          <Badge tone={s.status === 'closed' ? 'success' : 'pending'}>
            {s.status === 'closed' ? 'Selesai' : 'Berjalan'}
          </Badge>
        </div>
        <div class="mt-3 flex items-center gap-3">
          {#if s.fotoUrl}
            <button
              onclick={() =>
                (fotoBesar = { url: s.fotoUrl!, judul: `${s.tentorNama} · ${s.kelasNama}` })}
              class="block"
            >
              <img
                src={s.fotoUrl}
                alt="Presensi {s.tentorNama}"
                class="h-16 w-16 rounded-lg border border-border object-cover"
              />
            </button>
          {:else}
            <span class="text-xs text-muted-foreground">—</span>
          {/if}
          <div>
            <p class="text-xs text-muted-foreground">Diunggah sistem</p>
            <p class="font-mono text-xs text-foreground">{waktu(s.uploadedAt)}</p>
          </div>
        </div>
      </Card>
    {/each}
  </div>

  <div class="mt-6 hidden md:block">
    <Table>
      {#snippet head()}
        <Th>Tentor</Th>
        <Th>Kelas</Th>
        <Th>Mapel</Th>
        <Th>Foto</Th>
        <Th>Diunggah sistem</Th>
        <Th>Status</Th>
      {/snippet}
      {#snippet body()}
        {#each data.sesi as s (s.id)}
          <tr class="border-b border-border hover:bg-muted/30">
            <Td class="font-medium">{s.tentorNama}</Td>
            <Td class="text-muted-foreground">{s.kelasNama}</Td>
            <Td class="text-muted-foreground">{s.mapelNama}</Td>
            <Td>
              {#if s.fotoUrl}
                <button
                  onclick={() =>
                    (fotoBesar = { url: s.fotoUrl!, judul: `${s.tentorNama} · ${s.kelasNama}` })}
                  class="block"
                >
                  <img
                    src={s.fotoUrl}
                    alt="Presensi {s.tentorNama}"
                    class="h-14 w-14 rounded-lg border border-border object-cover hover:opacity-80"
                  />
                </button>
              {:else}
                <span class="text-xs text-muted-foreground">—</span>
              {/if}
            </Td>
            <Td numeric class="text-muted-foreground">{waktu(s.uploadedAt)}</Td>
            <Td>
              <Badge tone={s.status === 'closed' ? 'success' : 'pending'}>
                {s.status === 'closed' ? 'Selesai' : 'Berjalan'}
              </Badge>
            </Td>
          </tr>
        {/each}
      {/snippet}
    </Table>
  </div>
{/if}

{#if fotoBesar}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
    role="button"
    tabindex="0"
    onclick={() => (fotoBesar = null)}
    onkeydown={(e) => e.key === 'Escape' && (fotoBesar = null)}
  >
    <div class="max-h-full max-w-3xl overflow-auto rounded-xl border border-border bg-card p-4">
      <div class="mb-3 flex items-center justify-between gap-4">
        <h3 class="font-serif text-base text-foreground">{fotoBesar.judul}</h3>
        <button
          onclick={() => (fotoBesar = null)}
          class="rounded-lg p-2.5 hover:bg-muted/40"
          aria-label="Tutup"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
      <img src={fotoBesar.url} alt="Foto presensi ukuran penuh" class="w-full rounded-lg" />
      <p class="mt-3 text-xs text-muted-foreground">
        Waktu dan lokasi yang terbakar di foto dibaca langsung dari gambar — sistem tidak
        mengurainya.
      </p>
    </div>
  </div>
{/if}
