<script lang="ts">
  import { goto } from '$app/navigation'

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

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Nilai Siswa</h1>
        <p class="mt-1 text-sm text-gray-600">Lihat nilai e-learning dan nilai manual per siswa</p>
      </div>
      <button onclick={() => goto('/tentor/nilai/input')} class="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-hover">
        + Input Nilai Manual
      </button>
    </div>

    <div class="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Filter</h2>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="mapel" class="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
          <select
            id="mapel"
            value={data.mapelId}
            onchange={(e) => applyFilter((e.currentTarget as HTMLSelectElement).value, '')}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2"
          >
            <option value="">Pilih Mapel...</option>
            {#each data.mapel as m (m.id)}
              <option value={m.id}>{m.nama}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="kelas" class="block text-sm font-medium text-gray-700">Kelas (Opsional)</label>
          <select
            id="kelas"
            value={data.kelasId}
            disabled={!data.mapelId}
            onchange={(e) => applyFilter(data.mapelId, (e.currentTarget as HTMLSelectElement).value)}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2 disabled:bg-gray-50"
          >
            <option value="">Semua Kelas</option>
            {#each data.kelas as k (k.id)}
              <option value={k.id}>{k.nama}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    {#if !data.mapelId}
      <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <p class="text-gray-600">Pilih mapel untuk melihat nilai siswa</p>
      </div>
    {:else if data.siswa.length === 0}
      <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <p class="text-gray-600">Belum ada siswa untuk filter ini</p>
      </div>
    {:else}
      <div class="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div class="text-center">
          <p class="mb-1 text-sm font-medium text-emerald-700">Rata-rata Kelas</p>
          <div class="text-3xl font-bold text-emerald-600">{data.rataRataKelas}</div>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50">
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nama Siswa</th>
                <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900">Try Out</th>
                <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900">Nilai Manual</th>
                <th class="px-6 py-3 text-center text-sm font-semibold text-gray-900">Rata-rata</th>
              </tr>
            </thead>
            <tbody>
              {#each data.siswa as siswa (siswa.id)}
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="px-6 py-4 text-sm">
                    <span class="block font-medium text-gray-900">{siswa.nama}</span>
                    <span class="text-xs text-gray-500">{siswa.nis}</span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    {#if siswa.nilaiTryOut.length > 0}
                      <div class="flex flex-col items-center gap-1">
                        {#each siswa.nilaiTryOut as n}
                          <span class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {n.nilai}
                            <span class="font-normal text-blue-600">{n.judul}</span>
                          </span>
                        {/each}
                      </div>
                    {:else}
                      <span class="text-gray-400">—</span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-center">
                    {#if siswa.nilaiManual.length > 0}
                      <div class="flex flex-col gap-1">
                        {#each siswa.nilaiManual as n}
                          <div class="text-xs">
                            <span class="font-medium text-gray-900">{n.nilai}</span>
                            <span class="text-gray-500"> · {n.judul} ({n.tipe}, {tanggalPendek(n.tanggal)})</span>
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <span class="text-gray-400">—</span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-center">
                    {#if siswa.rataRata === null}
                      <span class="text-gray-400">Belum ada nilai</span>
                    {:else}
                      <span
                        class="inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-bold"
                        class:bg-emerald-50={siswa.rataRata >= 80}
                        class:text-emerald-700={siswa.rataRata >= 80}
                        class:bg-amber-50={siswa.rataRata >= 60 && siswa.rataRata < 80}
                        class:text-amber-700={siswa.rataRata >= 60 && siswa.rataRata < 80}
                        class:bg-red-50={siswa.rataRata < 60}
                        class:text-red-700={siswa.rataRata < 60}
                      >
                        {siswa.rataRata}
                      </span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
</div>
