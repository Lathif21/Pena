<script lang="ts">
  let { data } = $props()
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Kelola Konten</h1>
      <p class="mt-1 text-sm text-gray-500">Pilih mata pelajaran untuk mengelola materi</p>
    </div>

    {#if data.mapel.length === 0}
      <div class="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
        <p class="text-sm text-gray-500">Belum ada mata pelajaran. Buat mata pelajaran terlebih dahulu.</p>
      </div>
    {:else}
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each data.mapel as mapel (mapel.id)}
          <a href="/kepala-guru/konten/{mapel.id}/materi" class="group">
            <div class="rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-primary hover:shadow-sm">
              <h3 class="text-base font-semibold text-gray-900 group-hover:text-primary">
                {mapel.nama}
              </h3>
              {#if mapel.kelas_nama.length > 0}
                <div class="mt-2 flex flex-wrap gap-1">
                  {#each mapel.kelas_nama as nama}
                    <span class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {nama}
                    </span>
                  {/each}
                </div>
              {/if}
              <p class="mt-2 text-sm text-gray-500">Kelola materi, sub materi, dan modul</p>
              <div class="mt-4 flex items-center text-sm text-primary">
                Masuk →
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>
