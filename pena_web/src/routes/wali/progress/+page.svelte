<script lang="ts">
  import Card from '$lib/components/Card.svelte'
  import ProgressBar from '$lib/components/ProgressBar.svelte'
  import PilihAnak from '$features/parent/components/PilihAnak.svelte'
  import GrafikNilai from '$features/parent/components/GrafikNilai.svelte'
  import { TrendingUp, Users } from 'lucide-svelte'

  let { data } = $props()
</script>

<svelte:head>
  <title>Progress Nilai · Pena</title>
</svelte:head>

<div class="mb-6">
  <h1 class="font-serif text-2xl text-foreground">Progress Nilai</h1>
  <p class="mt-1 text-sm text-muted-foreground">
    Dari try out dan nilai manual. Latihan soal tidak dihitung — latihan boleh diulang tanpa batas.
  </p>
</div>

{#if !data.terpilih}
  <Card class="p-8 text-center">
    <Users class="mx-auto h-8 w-8 text-muted-foreground" />
    <p class="mt-2 text-sm text-muted-foreground">
      Belum ada anak yang tertaut ke akun ini. Hubungi kepala guru.
    </p>
  </Card>
{:else}
  <PilihAnak daftar={data.daftar} terpilih={data.terpilih.siswaDetailId} basis="/wali/progress" />

  <Card class="mb-6">
    <div class="flex flex-wrap items-baseline justify-between gap-3">
      <div>
        <h2 class="font-serif text-base text-foreground">{data.terpilih.nama}</h2>
        <p class="text-sm text-muted-foreground">
          <span class="font-mono">{data.terpilih.nis}</span> · {data.terpilih.kelasNama || 'Privat'}
        </p>
      </div>
      <div class="text-right">
        <p class="text-xs text-muted-foreground">Rata-rata keseluruhan</p>
        <p class="font-mono text-3xl text-foreground">{data.nilai.rataKeseluruhan ?? '—'}</p>
      </div>
    </div>
  </Card>

  {#if data.nilai.perMapel.length === 0}
    <Card class="p-8 text-center">
      <TrendingUp class="mx-auto h-8 w-8 text-muted-foreground" />
      <p class="mt-2 text-sm text-muted-foreground">Belum ada nilai yang tercatat.</p>
    </Card>
  {:else}
    <!-- Satu grafik per baris, di semua lebar: menyandingkan dua grafik di
         desktop membuat batangnya terlalu sempit untuk dibaca. -->
    <div class="space-y-6">
      {#each data.nilai.perMapel as m (m.mapelId)}
        <Card>
          <div class="flex flex-wrap items-baseline justify-between gap-3">
            <h3 class="font-serif text-base text-foreground">{m.nama}</h3>
            <span class="text-sm text-muted-foreground">
              Rata-rata <span class="font-mono text-foreground">{m.rata ?? '—'}</span>
            </span>
          </div>
          {#if m.rata !== null}
            <ProgressBar value={m.rata} showLabel={false} class="mt-2" />
          {/if}
          <GrafikNilai nilai={m.nilai} />
        </Card>
      {/each}
    </div>
  {/if}
{/if}
