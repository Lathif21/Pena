<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation'
  import { listMapelByKelas, openSesi, replaceFoto, type Pilihan } from '$features/attendance/data/sesi'

  let { data } = $props()

  let kelasId = $state('')
  let mapelId = $state('')
  let mapelOptions = $state<Pilihan[]>([])
  let memuatMapel = $state(false)
  let file = $state<File | null>(null)
  let preview = $state('')
  let loading = $state(false)
  let error = $state('')

  // Mapel bergantung pada kelas yang dipilih, jadi dimuat di klien saat kelas berubah.
  async function pilihKelas(id: string) {
    kelasId = id
    mapelId = ''
    mapelOptions = []
    if (!id) return

    memuatMapel = true
    error = ''
    try {
      mapelOptions = await listMapelByKelas(id, data.user.id)
      if (mapelOptions.length === 0) error = 'Tidak ada mapel yang Anda ajar di kelas ini.'
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal memuat mapel'
    } finally {
      memuatMapel = false
    }
  }

  function pilihFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const f = input.files?.[0] ?? null
    file = f
    // Preview dilepas lagi saat diganti supaya tidak menumpuk object URL.
    if (preview) URL.revokeObjectURL(preview)
    preview = f ? URL.createObjectURL(f) : ''
  }

  async function submit() {
    if (!file) { error = 'Pilih foto presensi dulu'; return }
    loading = true
    error = ''
    try {
      if (data.sesiAktif) {
        await replaceFoto(data.sesiAktif.id, file)
      } else {
        if (!kelasId || !mapelId) { error = 'Kelas dan mapel wajib dipilih'; loading = false; return }
        await openSesi(kelasId, mapelId, file)
      }
      file = null
      if (preview) { URL.revokeObjectURL(preview); preview = '' }
      await invalidateAll()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal menyimpan presensi'
    } finally {
      loading = false
    }
  }

  function waktu(iso: string) {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-2xl px-4 py-8">
    <button onclick={() => goto('/tentor/dashboard')} class="mb-4 text-sm font-medium text-primary hover:underline">
      ← Kembali ke Dashboard
    </button>
    <h1 class="text-2xl font-bold text-gray-900">Presensi Diri</h1>
    <p class="mt-1 text-sm text-gray-500">
      Unggah foto dari Timestamp Camera Free. Foto inilah catatan kehadiran Anda.
    </p>

    {#if error}
      <div class="mt-4 rounded-md bg-red-50 p-4"><p class="text-sm text-red-800">{error}</p></div>
    {/if}

    {#if data.sesiAktif}
      <div class="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <span class="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
          Sesi berjalan
        </span>
        <h2 class="mt-3 text-base font-semibold text-gray-900">
          {data.sesiAktif.kelasNama} · {data.sesiAktif.mapelNama}
        </h2>
        <dl class="mt-3 space-y-1 text-sm">
          <div class="flex justify-between">
            <dt class="text-gray-500">Diunggah sistem</dt>
            <dd class="font-medium text-gray-900">{waktu(data.sesiAktif.uploadedAt)}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-500">Sesi dimulai</dt>
            <dd class="font-medium text-gray-900">{waktu(data.sesiAktif.startedAt)}</dd>
          </div>
        </dl>

        {#if data.sesiAktif.fotoUrl}
          <img src={data.sesiAktif.fotoUrl} alt="Foto presensi" class="mt-4 w-full rounded-lg border border-emerald-200" />
          <p class="mt-2 text-xs text-gray-500">
            Waktu dan lokasi yang terbakar di foto dibaca langsung oleh Kepala Guru — sistem tidak mengurainya.
          </p>
        {/if}

        <div class="mt-4 flex gap-3">
          <button onclick={() => goto('/tentor/presensi/murid')} class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
            Lanjut Presensi Murid
          </button>
        </div>
      </div>
    {/if}

    <div class="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
      <h2 class="text-base font-semibold text-gray-900">
        {data.sesiAktif ? 'Ganti Foto Presensi' : 'Mulai Sesi'}
      </h2>

      {#if !data.sesiAktif}
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label for="kelas" class="block text-sm font-medium text-gray-700">Kelas</label>
            <select
              id="kelas"
              value={kelasId}
              onchange={(e) => pilihKelas((e.currentTarget as HTMLSelectElement).value)}
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-8 text-sm"
            >
              <option value="">Pilih kelas...</option>
              {#each data.kelas as k (k.id)}
                <option value={k.id}>{k.nama}</option>
              {/each}
            </select>
            {#if data.kelas.length === 0}
              <p class="mt-1 text-xs text-amber-700">Anda belum diassign ke kelas mana pun.</p>
            {/if}
          </div>

          <div>
            <label for="mapel" class="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
            <select
              id="mapel"
              bind:value={mapelId}
              disabled={!kelasId || memuatMapel}
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-8 text-sm disabled:bg-gray-50"
            >
              <option value="">{memuatMapel ? 'Memuat...' : 'Pilih mapel...'}</option>
              {#each mapelOptions as m (m.id)}
                <option value={m.id}>{m.nama}</option>
              {/each}
            </select>
          </div>
        </div>
      {/if}

      <div class="mt-4">
        <label for="foto" class="block text-sm font-medium text-gray-700">Foto Presensi</label>
        <input
          id="foto"
          type="file"
          accept="image/jpeg,image/png"
          onchange={pilihFile}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <p class="mt-1 text-xs text-gray-500">JPG atau PNG, maksimal 5MB.</p>
      </div>

      {#if preview}
        <img src={preview} alt="Pratinjau foto" class="mt-4 w-full rounded-lg border border-gray-200" />
      {/if}

      <button
        onclick={submit}
        disabled={loading || !file || (!data.sesiAktif && (!kelasId || !mapelId))}
        class="mt-4 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {loading ? 'Menyimpan...' : data.sesiAktif ? 'Ganti Foto' : 'Submit & Mulai Sesi'}
      </button>
    </div>
  </div>
</div>
