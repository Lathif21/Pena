<script lang="ts">
  import Card from '$lib/components/Card.svelte'
  import ProgressBar from '$lib/components/ProgressBar.svelte'
  import { Users } from 'lucide-svelte'

  let { data } = $props()

  let sapaan = $derived.by(() => {
    const jam = new Date().getHours()
    if (jam < 11) return 'Selamat pagi'
    if (jam < 15) return 'Selamat siang'
    if (jam < 18) return 'Selamat sore'
    return 'Selamat malam'
  })
</script>

<svelte:head>
  <title>Beranda · Pena</title>
</svelte:head>

<div class="mb-8">
  <h1 class="font-serif text-2xl text-foreground">{sapaan}, {data.profile.nama_lengkap}</h1>
  <p class="mt-1 text-sm text-muted-foreground">Ringkasan perkembangan anak Anda</p>
</div>

{#if data.anak.length === 0}
  <Card class="p-8 text-center">
    <Users class="mx-auto h-8 w-8 text-muted-foreground" />
    <p class="mt-2 text-sm text-muted-foreground">
      Belum ada anak yang tertaut ke akun ini. Hubungi kepala guru.
    </p>
  </Card>
{:else}
  <div class="grid gap-4 sm:grid-cols-2">
    {#each data.anak as a (a.siswaDetailId)}
      <Card>
        <h2 class="font-serif text-base text-foreground">{a.nama}</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          <span class="font-mono">{a.nis}</span> · {a.kelasNama || 'Privat'}
        </p>

        <div class="mt-4">
          <div class="flex items-baseline justify-between gap-3 text-sm">
            <span class="text-muted-foreground">Rata-rata nilai</span>
            <span class="font-mono text-foreground">{a.rataNilai ?? '—'}</span>
          </div>
          {#if a.rataNilai !== null}
            <ProgressBar value={a.rataNilai} showLabel={false} class="mt-1" />
          {/if}
          <p class="mt-1 text-xs text-muted-foreground">
            dari <span class="font-mono">{a.jumlahNilai}</span> nilai tercatat
          </p>
        </div>

        <div class="mt-4">
          <div class="flex items-baseline justify-between gap-3 text-sm">
            <span class="text-muted-foreground">Kehadiran</span>
            <span class="font-mono text-foreground">
              {#if a.persenHadir === null}
                —
              {:else}
                {a.hadir}/{a.totalPertemuan}
              {/if}
            </span>
          </div>
          {#if a.persenHadir !== null}
            <ProgressBar value={a.persenHadir} showLabel={false} class="mt-1" />
          {:else}
            <p class="mt-1 text-xs text-muted-foreground">
              {a.paket === 'privat'
                ? 'Siswa privat tidak memiliki catatan presensi.'
                : 'Belum ada pertemuan tercatat.'}
            </p>
          {/if}
        </div>

        <div class="mt-4 flex flex-wrap gap-3 text-sm">
          <a href="/wali/progress?anak={a.siswaDetailId}" class="font-medium text-primary hover:underline">
            Progress nilai
          </a>
          <a href="/wali/anak?anak={a.siswaDetailId}" class="font-medium text-primary hover:underline">
            Absensi
          </a>
        </div>
      </Card>
    {/each}
  </div>
{/if}
