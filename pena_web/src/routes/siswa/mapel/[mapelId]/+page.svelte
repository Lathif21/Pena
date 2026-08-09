<script lang="ts">
  let { data } = $props()

  let searchTerm = $state('')

  let filteredMateri = $derived.by(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return data.materi

    return data.materi
      .map(m => {
        const matchMateri = m.nama.toLowerCase().includes(term)
        const subMatch = m.sub_materi.filter(s => s.nama.toLowerCase().includes(term))
        if (matchMateri) return m
        if (subMatch.length > 0) return { ...m, sub_materi: subMatch }
        return null
      })
      .filter(Boolean)
  })
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-6">
      <a href="/siswa/mapel" class="text-sm font-medium text-primary hover:underline">
        ← Kembali ke Mata Pelajaran
      </a>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">{data.mapel.nama}</h1>
      <p class="mt-1 text-sm text-gray-500">Pilih materi untuk membaca modul</p>
    </div>

    <input
      type="text"
      placeholder="Cari materi atau sub materi..."
      bind:value={searchTerm}
      class="mb-6 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-primary focus:outline-none"
    />

    {#if data.materi.length === 0}
      <div class="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
        <p class="text-sm text-gray-500">Belum ada materi yang tersedia untuk mata pelajaran ini.</p>
      </div>
    {:else if filteredMateri.length === 0}
      <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <p class="text-sm text-gray-500">Tidak ada hasil untuk "{searchTerm}"</p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each filteredMateri as materi (materi.id)}
          <div class="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 class="text-base font-semibold text-gray-900">
              {materi.nomor_urut}. {materi.nama}
            </h2>

            <div class="mt-4 space-y-2">
              {#each materi.sub_materi as sub (sub.id)}
                <a
                  href="/siswa/mapel/{data.mapel.id}/materi/{materi.id}/{sub.id}"
                  class="block rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary"
                >
                  📄 {sub.nama}
                </a>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
