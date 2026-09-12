<script lang="ts">
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import ProgressBar from '$lib/components/ProgressBar.svelte'
  import Table from '$lib/components/Table.svelte'
  import Th from '$lib/components/Th.svelte'
  import Td from '$lib/components/Td.svelte'
  import { RotateCcw, Settings2, ChartNoAxesColumn } from 'lucide-svelte'

  let { data } = $props()

  const persen = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`)

  const periodeNama = new Date(`${data.periode.mulai}T00:00:00+07:00`).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  })

  // Tentor tanpa satu pun komponen belum bisa dinilai. Skor nol menyiratkan
  // kegagalan, padahal belum ada yang diukur.
  const belumAdaData = (t: (typeof data.tentor)[number]) => t.gain === null && t.jurnal === null
</script>

<svelte:head>
  <title>KPI Tentor · Pena</title>
</svelte:head>

<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
  <div>
    <h1 class="font-serif text-2xl text-foreground">KPI Tentor</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Periode {periodeNama} · bobot gain <span class="font-mono">{data.konfig.bobot_gain}</span>,
      jurnal <span class="font-mono">{data.konfig.bobot_jurnal}</span>
    </p>
  </div>
  <div class="flex flex-wrap gap-2">
    <Button variant="secondary" href="/kepala-guru/kpi/konfigurasi">
      <Settings2 class="mr-2 h-4 w-4" />
      Bobot
    </Button>
    {#if data.periode.berjalan}
      <Button href="/kepala-guru/kpi?hitung=1">
        <RotateCcw class="mr-2 h-4 w-4" />
        Hitung Ulang
      </Button>
    {/if}
  </div>
</div>

{#if !data.periode.berjalan}
  <div class="mb-6 rounded-xl border border-border bg-secondary p-4 text-sm text-secondary-foreground">
    Periode ini sudah lewat. Angkanya dibaca dari snapshot dan tidak dihitung ulang, supaya skor
    lampau tetap stabil meski bobot berubah.
  </div>
{/if}

{#if data.tentor.length === 0}
  <Card class="p-8 text-center">
    <ChartNoAxesColumn class="mx-auto h-8 w-8 text-muted-foreground" />
    <p class="mt-2 text-sm text-muted-foreground">Belum ada tentor terdaftar.</p>
  </Card>
{:else}
  <!-- Lima kolom bermakna — di bawah md jadi tumpukan card. -->
  <div class="space-y-3 md:hidden">
    {#each data.tentor as t (t.id)}
      <Card>
        <div class="flex items-start justify-between gap-3">
          <p class="font-medium text-foreground">{t.nama}</p>
          {#if belumAdaData(t)}
            <Badge tone="pending">Belum ada data</Badge>
          {:else}
            <span class="font-mono text-2xl text-foreground">{t.skor}</span>
          {/if}
        </div>
        {#if !belumAdaData(t)}
          <ProgressBar value={t.skor} showLabel={false} class="mt-2" />
        {/if}
        <dl class="mt-3 space-y-1 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-muted-foreground">Progress nilai</dt>
            <dd class="font-mono text-foreground">
              {persen(t.gain)}
              <span class="text-muted-foreground">({t.jumlahSiswaDinilai} siswa)</span>
            </dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-muted-foreground">Kelengkapan jurnal</dt>
            <dd class="font-mono text-foreground">
              {persen(t.jurnal)}
              {#if t.sesiBerjurnal !== null}
                <span class="text-muted-foreground">({t.sesiBerjurnal}/{t.jumlahSesi} sesi)</span>
              {:else}
                <span class="text-muted-foreground">({t.jumlahSesi} sesi)</span>
              {/if}
            </dd>
          </div>
        </dl>
      </Card>
    {/each}
  </div>

  <div class="hidden md:block">
    <Table>
      {#snippet head()}
        <Th>Tentor</Th>
        <Th>Progress Nilai</Th>
        <Th>Kelengkapan Jurnal</Th>
        <Th>Skor</Th>
      {/snippet}
      {#snippet body()}
        {#each data.tentor as t (t.id)}
          <tr class="border-b border-border hover:bg-muted/30">
            <Td class="font-medium">{t.nama}</Td>
            <Td>
              <!-- Penyebutnya selalu ikut: "67%" saja mengundang perdebatan,
                   "67% (2 dari 3)" tidak. -->
              <span class="font-mono">{persen(t.gain)}</span>
              <span class="text-xs text-muted-foreground">
                ({t.jumlahSiswaDinilai} siswa dinilai{t.jumlahSiswaDikecualikan
                  ? `, ${t.jumlahSiswaDikecualikan} dikecualikan`
                  : ''})
              </span>
            </Td>
            <Td>
              <span class="font-mono">{persen(t.jurnal)}</span>
              <span class="text-xs text-muted-foreground">
                {#if t.sesiBerjurnal !== null}
                  ({t.sesiBerjurnal} dari {t.jumlahSesi} sesi)
                {:else}
                  ({t.jumlahSesi} sesi)
                {/if}
              </span>
            </Td>
            <Td>
              {#if belumAdaData(t)}
                <Badge tone="pending">Belum ada data</Badge>
              {:else}
                <div class="flex items-center gap-3">
                  <ProgressBar value={t.skor} showLabel={false} class="w-20" />
                  <span class="font-mono text-sm text-foreground">{t.skor}</span>
                </div>
              {/if}
            </Td>
          </tr>
        {/each}
      {/snippet}
    </Table>
  </div>

  <p class="mt-4 text-xs text-muted-foreground">
    Progress nilai memakai Normalized Gain: <span class="font-mono">(post − pre) / (100 − pre)</span
    >. Siswa tanpa pre atau post, dan siswa yang pre-nya sudah 100, dikecualikan dari rata-rata —
    bukan dihitung nol. Latihan soal tidak pernah ikut.
  </p>
{/if}
