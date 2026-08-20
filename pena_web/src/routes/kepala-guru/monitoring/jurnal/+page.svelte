<script lang="ts">
  import { goto } from '$app/navigation'

  let { data } = $props()

  let tanggal = $state(data.filter.tanggal)
  let tentorId = $state(data.filter.tentorId)

  function terapkan() {
    const p = new URLSearchParams()
    if (tanggal) p.set('tanggal', tanggal)
    if (tentorId) p.set('tentor', tentorId)
    goto(`/kepala-guru/monitoring/jurnal${p.toString() ? `?${p}` : ''}`, { keepFocus: true, noScroll: true })
  }

  function reset() {
    tanggal = ''
    tentorId = ''
    goto('/kepala-guru/monitoring/jurnal', { keepFocus: true, noScroll: true })
  }

  function tanggalPanjang(iso: string | null) {
    return iso ? new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'full' }) : '—'
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-4xl px-4 py-8">
    <h1 class="text-2xl font-bold text-gray-900">Monitoring Jurnal Mengajar</h1>
    <p class="mt-1 text-sm text-gray-500">
      Sistem mencatat, Kepala Guru menilai sendiri. Tidak ada tombol setujui atau tolak di sini.
    </p>

    <div class="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label for="tanggal" class="block text-sm font-medium text-gray-700">Tanggal sesi</label>
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

    <div class="mt-6 space-y-4">
      {#if data.jurnal.length === 0}
        <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p class="text-sm text-gray-500">Belum ada jurnal yang disubmit untuk filter ini.</p>
        </div>
      {:else}
        {#each data.jurnal as j (j.id)}
          <div class="rounded-2xl border border-gray-200 bg-white p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold text-gray-900">{j.tentorNama}</h2>
                <p class="mt-1 text-sm text-gray-600">{j.kelasNama} · {j.mapelNama}</p>
                <p class="mt-1 text-xs text-gray-500">{tanggalPanjang(j.tanggalSesi)}</p>
              </div>
              <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Submitted
              </span>
            </div>

            <div class="mt-4 rounded-lg bg-gray-50 p-4">
              <p class="text-xs font-medium text-gray-500">Materi</p>
              <p class="mt-1 text-sm text-gray-900">{j.materiNama}</p>
              <p class="mt-3 text-xs font-medium text-gray-500">Deskripsi</p>
              <p class="mt-1 whitespace-pre-wrap text-sm text-gray-900">{j.deskripsi}</p>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>
