<script lang="ts">
  import { goto } from '$app/navigation'
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import Table from '$lib/components/Table.svelte'
  import Th from '$lib/components/Th.svelte'
  import Td from '$lib/components/Td.svelte'
  import { GraduationCap } from 'lucide-svelte'

  const gayaField =
    'mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-8 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none disabled:opacity-50'

  // Ambang warna rata-rata: hijau >= 80, kuning 60-79, merah < 60.
  const nada = (n: number) => (n >= 80 ? 'success' : n >= 60 ? 'pending' : 'error')

  let { data } = $props()

  // Filters live in the URL so the server can do the querying (and the authorization).
  function applyFilter(mapelId: string, kelasId: string) {
    const params = new URLSearchParams()
    if (mapelId) params.set('mapel', mapelId)
    if (kelasId) params.set('kelas', kelasId)
    const qs = params.toString()
    goto(qs ? `/tentor/nilai?${qs}` : '/tentor/nilai', { keepFocus: true, noScroll: true })
  }

  const tanggalPendek = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
</script>

<svelte:head>
  <title>Nilai Siswa · Pena</title>
</svelte:head>

<div class="mx-auto max-w-[1200px]">
  <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div>
      <h1 class="font-serif text-2xl text-foreground">Nilai Siswa</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Lihat nilai e-learning dan nilai manual per siswa
      </p>
    </div>
    <Button href="/tentor/nilai/input">+ Input Nilai Manual</Button>
  </div>

  <Card class="mb-6">
    <h2 class="mb-4 font-serif text-lg text-foreground">Filter</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label for="mapel" class="block text-sm font-medium text-foreground">Mata Pelajaran</label>
        <select
          id="mapel"
          value={data.mapelId}
          onchange={(e) => applyFilter((e.currentTarget as HTMLSelectElement).value, '')}
          class={gayaField}
        >
          <option value="">Pilih Mapel...</option>
          {#each data.mapel as m (m.id)}
            <option value={m.id}>{m.nama}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="kelas" class="block text-sm font-medium text-foreground">Kelas (Opsional)</label>
        <select
          id="kelas"
          value={data.kelasId}
          disabled={!data.mapelId}
          onchange={(e) => applyFilter(data.mapelId, (e.currentTarget as HTMLSelectElement).value)}
          class={gayaField}
        >
          <option value="">Semua Kelas</option>
          {#each data.kelas as k (k.id)}
            <option value={k.id}>{k.nama}</option>
          {/each}
        </select>
      </div>
    </div>
  </Card>

  {#if !data.mapelId}
    <Card class="p-8 text-center">
      <GraduationCap class="mx-auto h-8 w-8 text-muted-foreground" />
      <p class="mt-2 text-sm text-muted-foreground">Pilih mapel untuk melihat nilai siswa</p>
    </Card>
  {:else if data.siswa.length === 0}
    <Card class="p-8 text-center">
      <GraduationCap class="mx-auto h-8 w-8 text-muted-foreground" />
      <p class="mt-2 text-sm text-muted-foreground">Belum ada siswa untuk filter ini</p>
    </Card>
  {:else}
    <Card class="mb-6 text-center">
      <p class="text-sm text-muted-foreground">Rata-rata Kelas</p>
      <p class="mt-1 font-mono text-3xl text-foreground">{data.rataRataKelas}</p>
    </Card>

    <!-- Empat kolom bermakna — di bawah md jadi tumpukan card. -->
    <div class="space-y-3 md:hidden">
      {#each data.siswa as siswa (siswa.id)}
        <Card>
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-medium text-foreground">{siswa.nama}</p>
              <p class="font-mono text-xs text-muted-foreground">{siswa.nis}</p>
            </div>
            {#if siswa.rataRata === null}
              <Badge tone="pending">Belum ada nilai</Badge>
            {:else}
              <Badge tone={nada(siswa.rataRata)}>{siswa.rataRata}</Badge>
            {/if}
          </div>

          {#if siswa.nilaiTryOut.length > 0}
            <p class="mt-3 text-xs text-muted-foreground">Try out</p>
            <div class="mt-1 space-y-1">
              {#each siswa.nilaiTryOut as n}
                <div class="flex justify-between gap-3 text-sm">
                  <span class="min-w-0 truncate text-foreground">{n.judul}</span>
                  <span class="font-mono text-foreground">{n.nilai}</span>
                </div>
              {/each}
            </div>
          {/if}

          {#if siswa.nilaiManual.length > 0}
            <p class="mt-3 text-xs text-muted-foreground">Nilai manual</p>
            <div class="mt-1 space-y-1">
              {#each siswa.nilaiManual as n}
                <div class="flex justify-between gap-3 text-sm">
                  <span class="min-w-0 truncate text-foreground">
                    {n.judul}
                    <span class="text-muted-foreground">({n.tipe})</span>
                  </span>
                  <span class="font-mono text-foreground">{n.nilai}</span>
                </div>
              {/each}
            </div>
          {/if}
        </Card>
      {/each}
    </div>

    <div class="hidden md:block">
      <Table>
        {#snippet head()}
          <Th>Nama Siswa</Th>
          <Th>Try Out</Th>
          <Th>Nilai Manual</Th>
          <Th>Rata-rata</Th>
        {/snippet}
        {#snippet body()}
          {#each data.siswa as siswa (siswa.id)}
            <tr class="border-b border-border hover:bg-muted/30">
              <Td>
                <span class="block font-medium text-foreground">{siswa.nama}</span>
                <span class="font-mono text-xs text-muted-foreground">{siswa.nis}</span>
              </Td>
              <Td>
                {#if siswa.nilaiTryOut.length > 0}
                  <div class="flex flex-col gap-1">
                    {#each siswa.nilaiTryOut as n}
                      <span class="text-xs">
                        <span class="font-mono font-medium text-foreground">{n.nilai}</span>
                        <span class="text-muted-foreground"> · {n.judul}</span>
                      </span>
                    {/each}
                  </div>
                {:else}
                  <span class="text-muted-foreground">—</span>
                {/if}
              </Td>
              <Td>
                {#if siswa.nilaiManual.length > 0}
                  <div class="flex flex-col gap-1">
                    {#each siswa.nilaiManual as n}
                      <span class="text-xs">
                        <span class="font-mono font-medium text-foreground">{n.nilai}</span>
                        <span class="text-muted-foreground">
                          · {n.judul} ({n.tipe}, {tanggalPendek(n.tanggal)})
                        </span>
                      </span>
                    {/each}
                  </div>
                {:else}
                  <span class="text-muted-foreground">—</span>
                {/if}
              </Td>
              <Td>
                {#if siswa.rataRata === null}
                  <span class="text-xs text-muted-foreground">Belum ada nilai</span>
                {:else}
                  <Badge tone={nada(siswa.rataRata)}>{siswa.rataRata}</Badge>
                {/if}
              </Td>
            </tr>
          {/each}
        {/snippet}
      </Table>
    </div>
  {/if}
</div>
