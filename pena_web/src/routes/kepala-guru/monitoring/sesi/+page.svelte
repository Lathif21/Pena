<script lang="ts">
  import { goto } from '$app/navigation'

  let { data } = $props()

  let tanggal = $state(data.filter.tanggal)

  function terapkan() {
    goto(`/kepala-guru/monitoring/sesi${tanggal ? `?tanggal=${tanggal}` : ''}`, { keepFocus: true, noScroll: true })
  }

  function waktu(iso: string | null) {
    return iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-4xl px-4 py-8">
    <h1 class="text-2xl font-bold text-gray-900">Monitoring Sesi</h1>
    <p class="mt-1 text-sm text-gray-500">Ringkasan sesi yang sudah diselesaikan.</p>

    <div class="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label for="tanggal" class="block text-sm font-medium text-gray-700">Tanggal</label>
          <input id="tanggal" type="date" bind:value={tanggal} class="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <button onclick={terapkan} class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          Terapkan
        </button>
        <button onclick={() => { tanggal = ''; goto('/kepala-guru/monitoring/sesi') }} class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Reset
        </button>
      </div>
    </div>

    <div class="mt-6 space-y-4">
      {#if data.sesi.length === 0}
        <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p class="text-sm text-gray-500">Belum ada sesi selesai untuk filter ini.</p>
        </div>
      {:else}
        {#each data.sesi as s (s.id)}
          <div class="rounded-2xl border border-gray-200 bg-white p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold text-gray-900">{s.tentorNama}</h2>
                <p class="mt-1 text-sm text-gray-600">{s.kelasNama} · {s.mapelNama}</p>
              </div>
              <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Selesai
              </span>
            </div>

            <div class="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p class="text-xs font-medium text-gray-500">Presensi tentor</p>
                {#if s.fotoUrl}
                  <img src={s.fotoUrl} alt="Presensi {s.tentorNama}" class="mt-2 h-24 w-24 rounded-lg border border-gray-200 object-cover" />
                {:else}
                  <p class="mt-2 text-sm text-gray-400">—</p>
                {/if}
                <p class="mt-2 text-xs text-gray-500">Unggah {waktu(s.uploadedAt)}</p>
              </div>

              <div>
                <p class="text-xs font-medium text-gray-500">Kehadiran murid</p>
                <p class="mt-2 text-2xl font-bold text-gray-900">
                  {s.hadir}<span class="text-base font-medium text-gray-500">/{s.totalMurid}</span>
                </p>
                <p class="mt-1 text-xs text-gray-500">
                  {s.totalMurid === 0 ? 'Presensi murid belum diisi' : 'hadir dari total'}
                </p>
              </div>

              <div>
                <p class="text-xs font-medium text-gray-500">Waktu</p>
                <p class="mt-2 text-xs text-gray-700">Mulai {waktu(s.startedAt)}</p>
                <p class="mt-1 text-xs text-gray-700">Selesai {waktu(s.endedAt)}</p>
              </div>
            </div>

            <div class="mt-4 rounded-lg bg-gray-50 p-4">
              <p class="text-xs font-medium text-gray-500">Jurnal</p>
              {#if s.jurnal}
                <p class="mt-1 text-sm font-medium text-gray-900">{s.jurnal.materiNama}</p>
                <p class="mt-1 whitespace-pre-wrap text-sm text-gray-700">{s.jurnal.deskripsi}</p>
              {:else}
                <p class="mt-1 text-sm text-gray-400">Tidak ada jurnal</p>
              {/if}
            </div>

            {#if s.nilaiManual.length > 0}
              <div class="mt-4">
                <p class="text-xs font-medium text-gray-500">Nilai manual hari itu</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  {#each s.nilaiManual as n (n.id)}
                    <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {n.judul} · {n.nilai}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>
