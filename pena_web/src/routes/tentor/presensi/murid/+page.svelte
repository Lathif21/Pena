<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation'
  import { SvelteMap } from 'svelte/reactivity'
  import { savePresensi } from '$features/attendance/data/presensi-murid'

  let { data } = $props()

  // SvelteMap, bukan Map: $state tidak membuat koleksi bawaan reaktif, jadi
  // mutasi Map biasa tidak pernah merender ulang centang atau hitungan hadir.
  let hadir = new SvelteMap<string, boolean>(
    data.siswa.map((s) => [s.siswa_detail_id, data.tersimpan[s.siswa_detail_id] ?? true])
  )
  let loading = $state(false)
  let error = $state('')
  let message = $state('')

  let jumlahHadir = $derived([...hadir.values()].filter(Boolean).length)

  async function simpan() {
    if (!data.sesiAktif) return
    loading = true
    error = ''
    message = ''
    try {
      const hasil = await savePresensi(
        data.sesiAktif.id,
        data.siswa.map((s) => ({
          siswaDetailId: s.siswa_detail_id,
          isHadir: hadir.get(s.siswa_detail_id) ?? true
        }))
      )
      message = `Presensi tersimpan untuk ${hasil.saved} siswa`
      await invalidateAll()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal menyimpan presensi'
    } finally {
      loading = false
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-3xl px-4 py-8">
    <button onclick={() => goto('/tentor/dashboard')} class="mb-4 text-sm font-medium text-primary hover:underline">
      ← Kembali ke Dashboard
    </button>
    <h1 class="text-2xl font-bold text-gray-900">Presensi Murid</h1>

    {#if !data.sesiAktif}
      <div class="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p class="font-medium text-amber-900">Submit presensi diri dulu</p>
        <p class="mt-2 text-sm text-amber-800">
          Presensi murid baru terbuka setelah Anda mengunggah foto presensi dan sesi dimulai.
        </p>
        <button onclick={() => goto('/tentor/presensi/diri')} class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
          Ke Presensi Diri
        </button>
      </div>
    {:else}
      <p class="mt-1 text-sm text-gray-500">
        {data.sesiAktif.kelasNama} · {data.sesiAktif.mapelNama}
      </p>

      {#if error}
        <div class="mt-4 rounded-md bg-red-50 p-4"><p class="text-sm text-red-800">{error}</p></div>
      {/if}
      {#if message}
        <div class="mt-4 rounded-md bg-emerald-50 p-4"><p class="text-sm text-emerald-800">✓ {message}</p></div>
      {/if}

      <div class="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        {#if data.siswa.length === 0}
          <p class="text-center text-sm text-gray-500">
            Belum ada siswa reguler terdaftar di kelas ini. Siswa privat memang tidak pernah muncul di presensi.
          </p>
        {:else}
          <div class="mb-4 flex items-baseline justify-between">
            <h2 class="text-base font-semibold text-gray-900">Daftar Siswa ({data.siswa.length})</h2>
            <span class="text-sm text-gray-500">{jumlahHadir} hadir</span>
          </div>

          <div class="divide-y divide-gray-100">
            {#each data.siswa as s (s.siswa_detail_id)}
              <label class="flex cursor-pointer items-center gap-3 py-3 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={hadir.get(s.siswa_detail_id) ?? true}
                  onchange={(e) => hadir.set(s.siswa_detail_id, e.currentTarget.checked)}
                  class="h-4 w-4 rounded border-gray-300"
                />
                <span class="flex-1">
                  <span class="block text-sm font-medium text-gray-900">{s.nama_lengkap}</span>
                  <span class="block text-xs text-gray-500">{s.nis}</span>
                </span>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                  class:bg-emerald-50={hadir.get(s.siswa_detail_id) ?? true}
                  class:text-emerald-700={hadir.get(s.siswa_detail_id) ?? true}
                  class:bg-red-50={!(hadir.get(s.siswa_detail_id) ?? true)}
                  class:text-red-700={!(hadir.get(s.siswa_detail_id) ?? true)}
                >
                  {(hadir.get(s.siswa_detail_id) ?? true) ? 'Hadir' : 'Tidak hadir'}
                </span>
              </label>
            {/each}
          </div>

          <button
            onclick={simpan}
            disabled={loading}
            class="mt-6 w-full rounded-lg bg-primary px-4 py-3 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan Presensi'}
          </button>
          <p class="mt-2 text-center text-xs text-gray-500">
            Masih bisa dikoreksi selama sesi belum diselesaikan.
          </p>
        {/if}
      </div>
    {/if}
  </div>
</div>
