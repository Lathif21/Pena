<script lang="ts">
  import { enhance } from '$app/forms'
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import Table from '$lib/components/Table.svelte'
  import Th from '$lib/components/Th.svelte'
  import Td from '$lib/components/Td.svelte'

  let { data, form } = $props()

  const berlaku = data.riwayat[0]

  let gain = $state(berlaku?.bobot_gain ?? 60)
  let jurnal = $state(berlaku?.bobot_jurnal ?? 40)
  let periode = $state(berlaku?.periode ?? 'bulanan')

  let jumlah = $derived(Number(gain) + Number(jurnal))
  let sah = $derived(jumlah === 100)

  const tanggal = (iso: string) =>
    new Date(`${iso}T00:00:00+07:00`).toLocaleDateString('id-ID', { dateStyle: 'medium' })

  const gayaField =
    'mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none'
</script>

<svelte:head>
  <title>Bobot KPI · Pena</title>
</svelte:head>

<div class="mb-6">
  <a href="/kepala-guru/kpi" class="text-sm font-medium text-primary hover:underline">
    ← Kembali ke KPI
  </a>
  <h1 class="mt-4 font-serif text-2xl text-foreground">Bobot KPI</h1>
  <p class="mt-1 text-sm text-muted-foreground">
    Menyimpan membuat catatan bobot <strong class="text-foreground">baru</strong> yang berlaku mulai
    hari ini. Bobot lama tidak ditimpa — skor periode yang sudah lewat tetap dihitung dengan bobot
    yang berlaku saat itu.
  </p>
</div>

{#if form?.error}
  <div class="mb-4 rounded-lg bg-red-100 p-4"><p class="text-sm text-red-800">{form.error}</p></div>
{/if}
{#if form?.success}
  <div class="mb-4 rounded-lg bg-emerald-100 p-4">
    <p class="text-sm text-emerald-800">✓ Bobot baru tersimpan dan berlaku mulai hari ini.</p>
  </div>
{/if}

<Card class="mb-6">
  <h2 class="mb-4 font-serif text-lg text-foreground">Bobot Baru</h2>

  <form method="POST" action="?/simpan" use:enhance class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-3">
      <div>
        <label for="gain" class="block text-sm font-medium text-foreground">Progress nilai</label>
        <input
          id="gain"
          name="bobot_gain"
          type="number"
          min="0"
          max="100"
          bind:value={gain}
          required
          class="{gayaField} font-mono"
        />
      </div>
      <div>
        <label for="jurnal" class="block text-sm font-medium text-foreground">
          Kelengkapan jurnal
        </label>
        <input
          id="jurnal"
          name="bobot_jurnal"
          type="number"
          min="0"
          max="100"
          bind:value={jurnal}
          required
          class="{gayaField} font-mono"
        />
      </div>
      <div>
        <label for="periode" class="block text-sm font-medium text-foreground">Periode</label>
        <select id="periode" name="periode" bind:value={periode} class="{gayaField} pr-8">
          <option value="bulanan">Bulanan</option>
          <option value="semesteran">Semesteran</option>
        </select>
      </div>
    </div>

    <!-- Validasi di klien hanya untuk umpan balik cepat. Jumlah 100 dijaga
         endpoint dan check constraint database — keduanya tetap berlaku. -->
    <p class="text-sm {sah ? 'text-muted-foreground' : 'text-destructive'}">
      Jumlah: <span class="font-mono">{jumlah}</span>
      {#if !sah}
        — harus tepat 100
      {/if}
    </p>

    <Button type="submit" disabled={!sah} class="w-full sm:w-auto">Simpan Bobot Baru</Button>
  </form>
</Card>

<h2 class="mb-3 font-serif text-lg text-foreground">Riwayat Bobot</h2>

{#if data.riwayat.length === 0}
  <Card class="p-8 text-center">
    <p class="text-sm text-muted-foreground">
      Belum pernah diatur. KPI memakai bawaan <span class="font-mono">60</span> /
      <span class="font-mono">40</span> bulanan.
    </p>
  </Card>
{:else}
  <Table>
    {#snippet head()}
      <Th>Berlaku Dari</Th>
      <Th>Progress Nilai</Th>
      <Th>Kelengkapan Jurnal</Th>
      <Th>Periode</Th>
    {/snippet}
    {#snippet body()}
      {#each data.riwayat as r, i (r.id)}
        <tr class="border-b border-border">
          <Td numeric>
            {tanggal(r.valid_from)}
            {#if i === 0}
              <Badge tone="success">Berlaku</Badge>
            {/if}
          </Td>
          <Td numeric>{r.bobot_gain}</Td>
          <Td numeric>{r.bobot_jurnal}</Td>
          <Td class="text-muted-foreground">{r.periode}</Td>
        </tr>
      {/each}
    {/snippet}
  </Table>
{/if}
