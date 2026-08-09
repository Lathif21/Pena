<script lang="ts">
  import { goto } from '$app/navigation'

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

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-8">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Modul Pembelajaran</h1>
          <p class="mt-1 text-sm text-gray-600">Lihat materi yang Anda ajarkan</p>
        </div>
        <button
          onclick={() => goto('/tentor/dashboard')}
          class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Kembali
        </button>
      </div>

      <input
        type="text"
        placeholder="Cari mapel atau materi..."
        bind:value={searchTerm}
        class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-primary focus:outline-none"
      />
    </div>

    {#if data.mapel.length === 0}
      <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <p class="text-gray-600">Belum ada mata pelajaran yang diajarkan</p>
      </div>
    {:else}
      {@const filtered = getFilteredData()}
      {#if filtered.mapel.length === 0}
        <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p class="text-gray-600">Tidak ada hasil untuk "{searchTerm}"</p>
        </div>
      {:else}
        <div class="space-y-6">
          {#each filtered.mapel as mapel (mapel.id)}
            {@const materi = filtered.materiBulk[mapel.id] || []}
            {@const kelasForMapel = data.mapelKelasMap?.[mapel.id] || []}
            {#if materi.length > 0}
            <div class="rounded-2xl border border-gray-200 bg-white p-6">
              <div class="mb-4">
                <h2 class="text-lg font-semibold text-gray-900">{mapel.name}{kelas.nama}</h2>
                {#if kelasForMapel.length > 0}
                  <div class="mt-2 flex flex-wrap gap-2">
                    {#each kelasForMapel as kelasId}
                      {@const kelas = data.kelasLookup?.[kelasId]}
                      {#if kelas}
                        <span class="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                          {kelas.nama}
                        </span>
                      {/if}
                    {/each}
                  </div>
                {/if}
              </div>

              <div class="space-y-2">
                {#each materi as mat (mat.id)}
                  <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <h3 class="font-medium text-gray-900">{mat.nama}</h3>
                        <p class="mt-1 text-xs text-gray-500">
                          {mat.sub_materi?.length || 0} sub materi
                        </p>
                      </div>
                    </div>

                    {#if mat.sub_materi && mat.sub_materi.length > 0}
                      <div class="mt-3 space-y-1 border-t border-gray-200 pt-3">
                        {#each mat.sub_materi as sub (sub.id)}
                          <button
                            onclick={() => goto(`/tentor/modul/${mapel.id}/materi/${mat.id}/${sub.id}`)}
                            class="block w-full rounded-md bg-white px-3 py-2 text-left text-sm text-gray-700 hover:bg-primary/5 hover:text-primary"
                          >
                            📄 {sub.nama}
                          </button>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>
