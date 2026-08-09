<script lang="ts">
  let { data } = $props()
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-8">
      <a href="/siswa/dashboard" class="text-sm font-medium text-primary hover:underline">
        ← Kembali ke Dashboard
      </a>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">Mata Pelajaran</h1>
      {#if data.kelasNama.length > 0}
        <p class="mt-1 text-sm text-gray-500">{data.kelasNama.join(', ')}</p>
      {/if}
    </div>

    {#if data.mapel.length === 0}
      <div class="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
        <p class="text-sm text-gray-500">
          {#if data.kelasNama.length === 0}
            Anda belum terdaftar di kelas mana pun. Hubungi kepala guru.
          {:else}
            Belum ada mata pelajaran untuk kelas Anda.
          {/if}
        </p>
      </div>
    {:else}
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each data.mapel as mapel (mapel.id)}
          <a href="/siswa/mapel/{mapel.id}" class="group">
            <div class="rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-primary">
              <h2 class="text-base font-semibold text-gray-900 group-hover:text-primary">
                {mapel.nama}
              </h2>
              <p class="mt-2 text-sm text-gray-500">Lihat materi dan modul</p>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>
