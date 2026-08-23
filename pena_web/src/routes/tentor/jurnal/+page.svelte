<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation'
  import { saveJurnal } from '$features/journal/data/jurnal'

  let { data } = $props()

  let materiId = $state(data.jurnal?.materi_id ?? '')
  let deskripsi = $state(data.jurnal?.deskripsi ?? '')
  let loading = $state(false)
  let error = $state('')
  let message = $state('')

  async function simpan() {
    if (!data.sesiAktif) return
    if (!materiId) { error = 'Materi wajib dipilih'; return }
    if (!deskripsi.trim()) { error = 'Deskripsi wajib diisi'; return }

    loading = true
    error = ''
    message = ''
    try {
      await saveJurnal(data.sesiAktif.id, materiId, deskripsi)
      message = 'Jurnal tersimpan sebagai draft'
      await invalidateAll()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal menyimpan jurnal'
    } finally {
      loading = false
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-2xl px-4 py-8">
    <button onclick={() => goto('/tentor/dashboard')} class="mb-4 text-sm font-medium text-primary hover:underline">
      ← Kembali ke Dashboard
    </button>
    <h1 class="text-2xl font-bold text-gray-900">Jurnal Mengajar</h1>

    {#if !data.sesiAktif}
      <div class="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p class="font-medium text-amber-900">Belum ada sesi berjalan</p>
        <p class="mt-2 text-sm text-amber-800">Submit presensi diri dulu untuk membuka sesi.</p>
        <button onclick={() => goto('/tentor/presensi/diri')} class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          Ke Presensi Diri
        </button>
      </div>
    {:else}
      <p class="mt-1 text-sm text-gray-500">{data.sesiAktif.kelasNama} · {data.sesiAktif.mapelNama}</p>

      {#if error}
        <div class="mt-4 rounded-md bg-red-50 p-4"><p class="text-sm text-red-800">{error}</p></div>
      {/if}
      {#if message}
        <div class="mt-4 rounded-md bg-emerald-50 p-4"><p class="text-sm text-emerald-800">✓ {message}</p></div>
      {/if}

      <div class="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-900">Isi Jurnal</h2>
          {#if data.jurnal}
            <span
              class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
              class:bg-amber-50={data.jurnal.status === 'draft'}
              class:text-amber-700={data.jurnal.status === 'draft'}
              class:bg-emerald-50={data.jurnal.status === 'submitted'}
              class:text-emerald-700={data.jurnal.status === 'submitted'}
            >
              {data.jurnal.status === 'draft' ? 'Draft' : 'Submitted'}
            </span>
          {/if}
        </div>

        <div>
          <label for="materi" class="block text-sm font-medium text-gray-700">Materi</label>
          <select id="materi" bind:value={materiId} class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-8 text-sm">
            <option value="">Pilih materi...</option>
            {#each data.materi as m (m.id)}
              <option value={m.id}>{m.nomor_urut}. {m.nama}</option>
            {/each}
          </select>
          {#if data.materi.length === 0}
            <p class="mt-1 text-xs text-amber-700">Mapel ini belum punya materi. Minta Kepala Guru menambahkannya.</p>
          {/if}
        </div>

        <div class="mt-4">
          <label for="deskripsi" class="block text-sm font-medium text-gray-700">Deskripsi</label>
          <textarea
            id="deskripsi"
            bind:value={deskripsi}
            rows={6}
            placeholder="Apa yang diajarkan, sejauh mana siswa mengikuti, catatan lain..."
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          ></textarea>
        </div>

        <button
          onclick={simpan}
          disabled={loading}
          class="mt-4 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Draft'}
        </button>
        <p class="mt-2 text-xs text-gray-500">
          Jurnal baru berubah jadi <strong>submitted</strong> saat Anda menekan Selesai Mengajar di dashboard.
        </p>
      </div>
    {/if}
  </div>
</div>
