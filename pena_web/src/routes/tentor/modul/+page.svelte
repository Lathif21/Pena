<script lang="ts">
  import Badge from '$lib/components/Badge.svelte'
  import Card from '$lib/components/Card.svelte'
  import { BookOpen, FileText } from 'lucide-svelte'

  let { data } = $props()
  let searchTerm = $state('')

  function getFilteredData() {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return { mapel: data.mapel, materiBulk: data.materiBulk }

    const result: { mapel: typeof data.mapel; materiBulk: typeof data.materiBulk } = {
      mapel: [],
      materiBulk: {}
    }

    for (const mapel of data.mapel) {
      const materi = data.materiBulk[mapel.id] || []
      const filteredMateri = materi.filter(
        m =>
          m.nama.toLowerCase().includes(term) ||
          m.sub_materi?.some(s => s.nama.toLowerCase().includes(term))
      )

      if (mapel.nama.toLowerCase().includes(term) || filteredMateri.length > 0) {
        result.mapel.push(mapel)
        if (filteredMateri.length > 0) {
          result.materiBulk[mapel.id] = filteredMateri.map(m => ({
            ...m,
            sub_materi:
              m.sub_materi?.filter(s => s.nama.toLowerCase().includes(term)) || []
          }))
        } else {
          result.materiBulk[mapel.id] = materi
        }
      }
    }

    return result
  }
</script>

<svelte:head>
  <title>Modul Pembelajaran · Pena</title>
</svelte:head>

<div class="mx-auto max-w-5xl">
  <div class="mb-6">
    <h1 class="font-serif text-2xl text-foreground">Modul Pembelajaran</h1>
    <p class="mt-1 text-sm text-muted-foreground">Lihat materi yang Anda ajarkan</p>
  </div>

  <!-- ponytail: pencarian di klien. Jumlah mapel dan materi per tentor kecil,
       memuat semuanya sekali lebih murah daripada bolak-balik ke server. -->
  <input
    type="search"
    placeholder="Cari mapel atau materi..."
    bind:value={searchTerm}
    class="mb-6 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
  />

  {#if data.mapel.length === 0}
    <Card class="p-8 text-center">
      <BookOpen class="mx-auto h-8 w-8 text-muted-foreground" />
      <p class="mt-2 text-sm text-muted-foreground">Belum ada mata pelajaran yang diajarkan</p>
    </Card>
  {:else}
    {@const filtered = getFilteredData()}
    {#if filtered.mapel.length === 0}
      <Card class="p-8 text-center">
        <BookOpen class="mx-auto h-8 w-8 text-muted-foreground" />
        <p class="mt-2 text-sm text-muted-foreground">Tidak ada hasil untuk "{searchTerm}"</p>
      </Card>
    {:else}
      <div class="space-y-6">
        {#each filtered.mapel as mapel (mapel.id)}
          {@const materi = filtered.materiBulk[mapel.id] || []}
          {@const kelasForMapel = data.mapelKelasMap?.[mapel.id] || []}
          {#if materi.length > 0}
            <Card>
              <div class="mb-4">
                <h2 class="font-serif text-lg text-foreground">{mapel.nama}</h2>
                {#if kelasForMapel.length > 0}
                  <div class="mt-2 flex flex-wrap gap-2">
                    {#each kelasForMapel as kelasId}
                      {@const kelas = data.kelasLookup?.[kelasId]}
                      {#if kelas}
                        <Badge>{kelas.nama}</Badge>
                      {/if}
                    {/each}
                  </div>
                {/if}
              </div>

              <div class="space-y-2">
                {#each materi as mat (mat.id)}
                  <div class="rounded-lg border border-border bg-muted/30 p-4">
                    <h3 class="font-medium text-foreground">{mat.nama}</h3>
                    <p class="mt-1 text-xs text-muted-foreground">
                      <span class="font-mono">{mat.sub_materi?.length || 0}</span> sub materi
                    </p>

                    {#if mat.sub_materi && mat.sub_materi.length > 0}
                      <div class="mt-3 space-y-1 border-t border-border pt-3">
                        {#each mat.sub_materi as sub (sub.id)}
                          <a
                            href="/tentor/modul/{mapel.id}/materi/{mat.id}/{sub.id}"
                            class="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted/40"
                          >
                            <FileText class="h-4 w-4 shrink-0 text-muted-foreground" />
                            {sub.nama}
                          </a>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </Card>
          {/if}
        {/each}
      </div>
    {/if}
  {/if}
</div>
