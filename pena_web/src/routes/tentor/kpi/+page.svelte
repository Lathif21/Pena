<script lang="ts">
  import Badge from '$lib/components/Badge.svelte'
  import Card from '$lib/components/Card.svelte'
  import ProgressBar from '$lib/components/ProgressBar.svelte'
  import { ChartNoAxesColumn } from 'lucide-svelte'
  import { cukupData, MIN_SISWA, MIN_SESI } from '$features/kpi/data/hitung.js'

  let { data } = $props()

  const persen = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`)

  const periodeNama = (iso: string) =>
    new Date(`${iso}T00:00:00+07:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  let belumAdaData = $derived(data.kpi.gain === null && data.kpi.jurnal === null)
  let belumLengkap = $derived(
    !belumAdaData && !cukupData(data.kpi.jumlahSiswaDinilai, data.kpi.jumlahSesi)
  )
</script>

<svelte:head>
  <title>KPI Saya · Pena</title>
</svelte:head>

<div class="mb-6">
  <h1 class="font-serif text-2xl text-foreground">KPI Saya</h1>
  <p class="mt-1 text-l text-muted-foreground">
    Periode {periodeNama(data.periode.mulai)} · dihitung dari data, bukan penilaian manual
  </p>
</div>

<Card class="mb-6">
  {#if belumAdaData}
    <div class="py-8 text-center">
      <ChartNoAxesColumn class="mx-auto h-8 w-8 text-muted-foreground" />
      <Badge tone="pending">Belum ada data</Badge>
      <p class="mt-3 text-sm text-muted-foreground">
        Bulan ini belum ada sesi mengajar maupun pasangan nilai pre/post yang bisa dihitung.
      </p>
    </div>
  {:else if belumLengkap}
    <div class="py-8 text-center">
      <Badge tone="pending">Belum lengkap</Badge>
      <p class="mt-3 text-m text-muted-foreground">
        Skor muncul setelah ada minimal <span class="font-mono">{MIN_SISWA}</span> siswa dengan
        nilai pre dan post, serta <span class="font-mono">{MIN_SESI}</span> sesi mengajar bulan ini.
        Rinciannya tetap bisa dilihat di bawah.
      </p>
    </div>
  {:else}
    <p class="text-sm text-muted-foreground">Skor bulan ini</p>
    <p class="mt-1 font-mono text-4xl text-foreground">{data.kpi.skor}</p>
    <ProgressBar value={data.kpi.skor} showLabel={false} class="mt-3" />
  {/if}
</Card>

<div class="mb-6 grid gap-4 sm:grid-cols-2">
  <Card>
    <div class="flex items-baseline justify-between gap-3">
      <p class="text-sm text-muted-foreground">Progress nilai siswa</p>
      <span class="font-mono text-xs text-muted-foreground">bobot {data.konfig.bobot_gain}</span>
    </div>
    <p class="mt-1 font-mono text-2xl text-foreground">{persen(data.kpi.gain)}</p>
    {#if data.kpi.gain !== null}
      <ProgressBar value={data.kpi.gain * 100} showLabel={false} class="mt-2" />
    {/if}
    <p class="mt-2 text-s text-muted-foreground">
      Dari <span class="font-mono">{data.kpi.jumlahSiswaDinilai}</span> siswa yang punya nilai
      pre dan post
      {#if data.kpi.jumlahSiswaDikecualikan > 0}
        · <span class="font-mono">{data.kpi.jumlahSiswaDikecualikan}</span> dikecualikan karena
        belum punya pasangan nilai lengkap
      {/if}
    </p>
  </Card>

  <Card>
    <div class="flex items-baseline justify-between gap-3">
      <p class="text-sm text-muted-foreground">Kelengkapan jurnal</p>
      <span class="font-mono text-xs text-muted-foreground">bobot {data.konfig.bobot_jurnal}</span>
    </div>
    <p class="mt-1 font-mono text-2xl text-foreground">{persen(data.kpi.jurnal)}</p>
    {#if data.kpi.jurnal !== null}
      <ProgressBar value={data.kpi.jurnal * 100} showLabel={false} class="mt-2" />
    {/if}
    <p class="mt-2 text-s text-muted-foreground">
      <span class="font-mono">{data.kpi.sesiBerjurnal}</span> dari
      <span class="font-mono">{data.kpi.jumlahSesi}</span> sesi jurnalnya sudah tersubmit
    </p>
  </Card>
</div>

{#if data.riwayat.length > 0}
  <h2 class="mb-3 font-serif text-lg text-foreground">Periode Sebelumnya</h2>
  <div class="space-y-3">
    {#each data.riwayat as r (r.periodeMulai)}
      <Card>
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <p class="font-medium text-foreground">{periodeNama(r.periodeMulai)}</p>
          <span class="font-mono text-lg text-foreground">{r.skor}</span>
        </div>
        <p class="mt-1 text-xs text-muted-foreground">
          gain {persen(r.gain)} (<span class="font-mono">{r.jumlahSiswaDinilai}</span> siswa) ·
          jurnal {persen(r.jurnal)} (<span class="font-mono">{r.jumlahSesi}</span> sesi)
        </p>
      </Card>
    {/each}
  </div>
{/if}

<p class="mt-6 text-xs text-muted-foreground">
  Progress nilai memakai Normalized Gain: <span class="font-mono">(post − pre) / (100 − pre)</span>,
  yaitu berapa bagian dari ruang perbaikan yang tersisa berhasil ditutup. Presensi diri dan latihan
  soal tidak masuk hitungan.
</p>
