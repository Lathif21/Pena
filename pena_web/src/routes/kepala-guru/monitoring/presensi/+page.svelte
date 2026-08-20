<script lang="ts">
  import { goto } from '$app/navigation'

  let { data } = $props()

  let tanggal = $state(data.filter.tanggal)
  let tentorId = $state(data.filter.tentorId)
  let fotoBesar = $state<{ url: string; judul: string } | null>(null)

  function terapkan() {
    const p = new URLSearchParams()
    if (tanggal) p.set('tanggal', tanggal)
    if (tentorId) p.set('tentor', tentorId)
    goto(`/kepala-guru/monitoring/presensi${p.toString() ? `?${p}` : ''}`, { keepFocus: true, noScroll: true })
  }

  function reset() {
    tanggal = ''
    tentorId = ''
    goto('/kepala-guru/monitoring/presensi', { keepFocus: true, noScroll: true })
  }

  function waktu(iso: string) {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-7xl px-4 py-8">
    <h1 class="text-2xl font-bold text-gray-900">Monitoring Presensi Tentor</h1>
    <p class="mt-1 text-sm text-gray-500">
      Foto dari Timestamp Camera memuat waktu dan lokasi. Bandingkan dengan waktu unggah sistem.
    </p>

    <div class="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label for="tanggal" class="block text-sm font-medium text-gray-700">Tanggal</label>
          <input id="tanggal" type="date" bind:value={tanggal} class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label for="tentor" class="block text-sm font-medium text-gray-700">Tentor</label>
          <select id="tentor" bind:value={tentorId} class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-8 text-sm">
            <option value="">Semua tentor</option>
            {#each data.tentor as t (t.id)}
              <option value={t.id}>{t.nama_lengkap}</option>
            {/each}
          </select>
        </div>
        <div class="flex items-end gap-2">
          <button onclick={terapkan} class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
            Terapkan
          </button>
          <button onclick={reset} class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Reset
          </button>
        </div>
      </div>
    </div>

    <div class="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {#if data.sesi.length === 0}
        <p class="p-8 text-center text-sm text-gray-500">Tidak ada presensi untuk filter ini.</p>
      {:else}
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50">
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tentor</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Kelas</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Mapel</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Foto</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Diunggah sistem</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {#each data.sesi as s (s.id)}
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">{s.tentorNama}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{s.kelasNama}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{s.mapelNama}</td>
                  <td class="px-6 py-4">
                    {#if s.fotoUrl}
                      <button onclick={() => (fotoBesar = { url: s.fotoUrl!, judul: `${s.tentorNama} · ${s.kelasNama}` })} class="block">
                        <img src={s.fotoUrl} alt="Presensi {s.tentorNama}" class="h-14 w-14 rounded-lg border border-gray-200 object-cover hover:opacity-80" />
                      </button>
                    {:else}
                      <span class="text-xs text-gray-400">—</span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">{waktu(s.uploadedAt)}</td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                      class:bg-emerald-50={s.status === 'closed'}
                      class:text-emerald-700={s.status === 'closed'}
                      class:bg-amber-50={s.status === 'open'}
                      class:text-amber-700={s.status === 'open'}
                    >
                      {s.status === 'closed' ? 'Selesai' : 'Berjalan'}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

{#if fotoBesar}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    role="button"
    tabindex="0"
    onclick={() => (fotoBesar = null)}
    onkeydown={(e) => e.key === 'Escape' && (fotoBesar = null)}
  >
    <div class="max-h-full max-w-3xl overflow-auto rounded-2xl bg-white p-4">
      <div class="mb-3 flex items-center justify-between gap-4">
        <h3 class="text-base font-semibold text-gray-900">{fotoBesar.judul}</h3>
        <button onclick={() => (fotoBesar = null)} class="rounded-full p-2 hover:bg-gray-100" aria-label="Tutup">×</button>
      </div>
      <img src={fotoBesar.url} alt="Foto presensi ukuran penuh" class="w-full rounded-lg" />
      <p class="mt-3 text-xs text-gray-500">
        Waktu dan lokasi yang terbakar di foto dibaca langsung dari gambar — sistem tidak mengurainya.
      </p>
    </div>
  </div>
{/if}
