<script lang="ts">
  import { goto } from '$app/navigation'
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import Table from '$lib/components/Table.svelte'
  import Th from '$lib/components/Th.svelte'
  import Td from '$lib/components/Td.svelte'
  import { UserRoundX, TriangleAlert } from 'lucide-svelte'

  let { data } = $props()

  let tanggal = $state(data.filter.tanggal)
  let tentorId = $state(data.filter.tentorId)

  function terapkan() {
    const p = new URLSearchParams()
    if (tanggal) p.set('tanggal', tanggal)
    if (tentorId) p.set('tentor', tentorId)
    goto(`/kepala-guru/monitoring/relief${p.toString() ? `?${p}` : ''}`, {
      keepFocus: true,
      noScroll: true
    })
  }

  function reset() {
    tanggal = ''
    tentorId = ''
    goto('/kepala-guru/monitoring/relief', { keepFocus: true, noScroll: true })
  }

  const tanggalPendek = (iso: string) =>
    new Date(`${iso}T00:00:00+07:00`).toLocaleDateString('id-ID', { dateStyle: 'medium' })

  let gagalEmail = $derived(data.relief.filter((r) => r.emailError).length)

  const gayaField =
    'mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none'
</script>

<h1 class="font-serif text-2xl text-foreground">Monitoring Relief</h1>
<p class="mt-1 text-sm text-muted-foreground">
  Tentor yang berhalangan dan penggantinya. Sesi relief tercatat atas nama pengganti — KPI tidak
  disesuaikan.
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
      <p class="mt-1 text-xs text-muted-foreground">Mencakup sebagai tentor asli maupun pengganti.</p>
    </div>
    <div class="flex items-end gap-2">
      <Button onclick={terapkan}>Terapkan</Button>
      <Button variant="secondary" onclick={reset}>Reset</Button>
    </div>
  </div>
</Card>

{#if gagalEmail > 0}
  <div class="mt-6 flex items-start gap-2 rounded-xl border border-border bg-amber-100 p-4">
    <TriangleAlert class="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
    <p class="text-sm text-amber-800">
      <span class="font-mono">{gagalEmail}</span> relief gagal dikirim emailnya. Penggantinya
      mungkin belum tahu — baris bertanda di bawah perlu dikonfirmasi manual.
    </p>
  </div>
{/if}

{#if data.relief.length === 0}
  <Card class="mt-6 p-8 text-center">
    <UserRoundX class="mx-auto h-8 w-8 text-muted-foreground" />
    <p class="mt-2 text-sm text-muted-foreground">Tidak ada relief untuk filter ini.</p>
  </Card>
{:else}
  <!-- Tujuh kolom bermakna — di bawah md jadi tumpukan card. -->
  <div class="mt-6 space-y-3 md:hidden">
    {#each data.relief as r (r.id)}
      <Card class={r.emailError ? 'border-l-2 border-l-amber-500' : ''}>
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-mono text-sm text-foreground">{tanggalPendek(r.tanggal)}</p>
            <p class="font-medium text-foreground">{r.kelasNama} · {r.mapelNama}</p>
          </div>
          <Badge tone={r.status === 'aktif' ? 'success' : 'pending'}>
            {r.status === 'aktif' ? 'Aktif' : 'Dibatalkan'}
          </Badge>
        </div>
        <dl class="mt-3 space-y-1 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-muted-foreground">Tentor asli</dt>
            <dd class="text-foreground">{r.tentorAsliNama}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-muted-foreground">Pengganti</dt>
            <dd class="text-foreground">{r.penggantiNama}</dd>
          </div>
        </dl>
        <div class="mt-3 rounded-lg bg-muted/30 p-3">
          <p class="text-xs font-medium text-muted-foreground">Task delegasi</p>
          <p class="mt-1 whitespace-pre-wrap text-sm text-foreground">{r.task}</p>
        </div>
        {#if r.emailError}
          <p class="mt-2 text-xs text-amber-800">Email gagal terkirim — konfirmasi manual.</p>
        {/if}
      </Card>
    {/each}
  </div>

  <div class="mt-6 hidden md:block">
    <Table>
      {#snippet head()}
        <Th>Tanggal</Th>
        <Th>Tentor Asli</Th>
        <Th>Pengganti</Th>
        <Th>Kelas</Th>
        <Th>Mapel</Th>
        <Th>Task</Th>
        <Th>Status</Th>
      {/snippet}
      {#snippet body()}
        {#each data.relief as r (r.id)}
          <tr class="border-b border-border hover:bg-muted/30 {r.emailError ? 'bg-amber-100/50' : ''}">
            <Td numeric>{tanggalPendek(r.tanggal)}</Td>
            <Td>{r.tentorAsliNama}</Td>
            <Td>{r.penggantiNama}</Td>
            <Td class="text-muted-foreground">{r.kelasNama}</Td>
            <Td class="text-muted-foreground">{r.mapelNama}</Td>
            <Td class="max-w-xs">
              <span class="line-clamp-2 text-muted-foreground">{r.task}</span>
            </Td>
            <Td>
              <div class="flex items-center gap-2">
                <Badge tone={r.status === 'aktif' ? 'success' : 'pending'}>
                  {r.status === 'aktif' ? 'Aktif' : 'Dibatalkan'}
                </Badge>
                {#if r.emailError}
                  <span title="Email gagal terkirim">
                    <TriangleAlert class="h-4 w-4 text-amber-800" />
                  </span>
                {/if}
              </div>
            </Td>
          </tr>
        {/each}
      {/snippet}
    </Table>
  </div>
{/if}
