<script lang="ts">
  import { pesanRamah } from '$lib/utils/pesan'
  import { invalidateAll } from '$app/navigation'
  import { listMapelByKelas, openSesi, replaceFoto, type Pilihan } from '$features/attendance/data/sesi'
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'

  const gayaField =
    'mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none disabled:opacity-50'

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
  // Kelas relief tidak ada di tentor_kelas_mapel, jadi listMapelByKelas akan
  // mengembalikan kosong. Mapelnya diambil langsung dari baris reliefnya.
  let reliefTerpilih = $derived(data.relief.filter((r) => r.kelasId === kelasId))

  async function pilihKelas(id: string) {
    kelasId = id
    mapelId = ''
    mapelOptions = []
    if (!id) return

    const dariRelief = data.relief.filter((r) => r.kelasId === id)
    if (dariRelief.length > 0) {
      mapelOptions = dariRelief.map((r) => ({ id: r.mapelId, nama: r.mapelNama }))
      return
    }

    memuatMapel = true
    error = ''
    try {
      mapelOptions = await listMapelByKelas(id, data.user.id)
      if (mapelOptions.length === 0) error = 'Tidak ada mapel yang Anda ajar di kelas ini.'
    } catch (err) {
      error = pesanRamah(err, 'Gagal memuat mapel')
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
      error = pesanRamah(err, 'Gagal menyimpan presensi')
    } finally {
      loading = false
    }
  }

  function waktu(iso: string) {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })
  }
</script>

<svelte:head>
  <title>Presensi Diri · Pena</title>
</svelte:head>

<div class="mx-auto max-w-2xl">
  <h1 class="font-serif text-2xl text-foreground">Presensi Diri</h1>
  <p class="mt-1 text-sm text-muted-foreground">
    Unggah foto dari Timestamp Camera Free. Foto inilah catatan kehadiran Anda.
  </p>

  {#if error}
    <div class="mt-4 rounded-lg bg-red-100 p-4"><p class="text-sm text-red-800">{error}</p></div>
  {/if}

  {#if data.sesiAktif}
    <Card class="mt-6">
      <Badge tone="success">Sesi berjalan</Badge>
      <h2 class="mt-3 font-serif text-base text-foreground">
        {data.sesiAktif.kelasNama} · {data.sesiAktif.mapelNama}
      </h2>
      <dl class="mt-3 space-y-1 text-sm">
        <div class="flex justify-between gap-3">
          <dt class="text-muted-foreground">Diunggah sistem</dt>
          <dd class="font-mono text-foreground">{waktu(data.sesiAktif.uploadedAt)}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-muted-foreground">Sesi dimulai</dt>
          <dd class="font-mono text-foreground">{waktu(data.sesiAktif.startedAt)}</dd>
        </div>
      </dl>

      {#if data.sesiAktif.fotoUrl}
        <img
          src={data.sesiAktif.fotoUrl}
          alt="Foto presensi"
          class="mt-4 w-full rounded-lg border border-border"
        />
        <p class="mt-2 text-xs text-muted-foreground">
          Waktu dan lokasi yang terbakar di foto dibaca langsung oleh Kepala Guru — sistem tidak
          mengurainya.
        </p>
      {/if}

      <Button href="/tentor/presensi/murid" class="mt-4">Lanjut Presensi Murid</Button>
    </Card>
  {/if}

  <Card class="mt-6">
    <h2 class="font-serif text-base text-foreground">
      {data.sesiAktif ? 'Ganti Foto Presensi' : 'Mulai Sesi'}
    </h2>

    {#if reliefTerpilih.length > 0}
      <div class="mt-4 rounded-lg border-l-2 border-l-accent bg-muted/30 p-4">
        <p class="text-xs font-medium text-muted-foreground">
          Task delegasi dari {reliefTerpilih[0].tentorAsliNama}
        </p>
        <p class="mt-1 whitespace-pre-wrap text-sm text-foreground">{reliefTerpilih[0].task}</p>
      </div>
    {/if}

    {#if !data.sesiAktif}
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label for="kelas" class="block text-sm font-medium text-foreground">Kelas</label>
          <select
            id="kelas"
            value={kelasId}
            onchange={(e) => pilihKelas((e.currentTarget as HTMLSelectElement).value)}
            class="{gayaField} pr-8"
          >
            <option value="">Pilih kelas...</option>
            {#each data.kelas as k (k.id)}
              <option value={k.id}>{k.nama}{k.relief ? ' (relief)' : ''}</option>
            {/each}
          </select>
          {#if data.kelas.length === 0}
            <p class="mt-1 text-xs text-amber-800">Anda belum diassign ke kelas mana pun.</p>
          {/if}
        </div>

        <div>
          <label for="mapel" class="block text-sm font-medium text-foreground">Mata Pelajaran</label>
          <select
            id="mapel"
            bind:value={mapelId}
            disabled={!kelasId || memuatMapel}
            class="{gayaField} pr-8"
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
      <label for="foto" class="block text-sm font-medium text-foreground">Foto Presensi</label>
      <!-- accept sengaja jpeg/png, bukan image/*: bucket presensi-foto hanya
           menerima dua MIME itu, jadi HEIC bawaan iPhone akan ditolak server
           setelah menunggu unggahan. Ini tetap file input biasa, jadi galeri HP
           tetap terbuka — yang dilarang design-system adalah zona drag-and-drop. -->
      <input
        id="foto"
        type="file"
        accept="image/jpeg,image/png"
        onchange={pilihFile}
        class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
      />
      <p class="mt-1 text-xs text-muted-foreground">JPG atau PNG, maksimal 5MB.</p>
    </div>

    {#if preview}
      <img src={preview} alt="Pratinjau foto" class="mt-4 w-full rounded-lg border border-border" />
    {/if}

    <Button
      onclick={submit}
      disabled={loading || !file || (!data.sesiAktif && (!kelasId || !mapelId))}
      class="mt-4 w-full sm:w-auto"
    >
      {loading ? 'Menyimpan...' : data.sesiAktif ? 'Ganti Foto' : 'Submit & Mulai Sesi'}
    </Button>
  </Card>
</div>
