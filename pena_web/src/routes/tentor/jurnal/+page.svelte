<script lang="ts">
  import { pesanRamah } from '$lib/utils/pesan'
  import { invalidateAll } from '$app/navigation'
  import { saveJurnal } from '$features/journal/data/jurnal'
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import { CalendarX } from 'lucide-svelte'

  const gayaField =
    'mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none'

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
      error = pesanRamah(err, 'Gagal menyimpan jurnal')
    } finally {
      loading = false
    }
  }
</script>

<svelte:head>
  <title>Jurnal Mengajar · Pena</title>
</svelte:head>

<div class="mx-auto max-w-2xl">
  <h1 class="font-serif text-2xl text-foreground">Jurnal Mengajar</h1>

  {#if !data.sesiAktif}
    <Card class="mt-6 p-8 text-center">
      <CalendarX class="mx-auto h-8 w-8 text-muted-foreground" />
      <p class="mt-2 font-medium text-foreground">Belum ada sesi berjalan</p>
      <p class="mt-2 text-sm text-muted-foreground">Submit presensi diri dulu untuk membuka sesi.</p>
      <Button href="/tentor/presensi/diri" class="mt-4">Ke Presensi Diri</Button>
    </Card>
  {:else}
    <p class="mt-1 text-sm text-muted-foreground">
      {data.sesiAktif.kelasNama} · {data.sesiAktif.mapelNama}
    </p>

    {#if error}
      <div class="mt-4 rounded-lg bg-red-100 p-4"><p class="text-sm text-red-800">{error}</p></div>
    {/if}
    {#if message}
      <div class="mt-4 rounded-lg bg-emerald-100 p-4">
        <p class="text-sm text-emerald-800">✓ {message}</p>
      </div>
    {/if}

    <Card class="mt-6">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h2 class="font-serif text-base text-foreground">Isi Jurnal</h2>
        {#if data.jurnal}
          <Badge tone={data.jurnal.status === 'draft' ? 'pending' : 'success'}>
            {data.jurnal.status === 'draft' ? 'Draft' : 'Submitted'}
          </Badge>
        {/if}
      </div>

      <div>
        <label for="materi" class="block text-sm font-medium text-foreground">Materi</label>
        <select id="materi" bind:value={materiId} class="{gayaField} pr-8">
          <option value="">Pilih materi...</option>
          {#each data.materi as m (m.id)}
            <option value={m.id}>{m.nomor_urut}. {m.nama}</option>
          {/each}
        </select>
        {#if data.materi.length === 0}
          <p class="mt-1 text-xs text-amber-800">
            Mapel ini belum punya materi. Minta Kepala Guru menambahkannya.
          </p>
        {/if}
      </div>

      <div class="mt-4">
        <label for="deskripsi" class="block text-sm font-medium text-foreground">Deskripsi</label>
        <textarea
          id="deskripsi"
          bind:value={deskripsi}
          rows={6}
          placeholder="Apa yang diajarkan, sejauh mana siswa mengikuti, catatan lain..."
          class={gayaField}
        ></textarea>
      </div>

      <Button onclick={simpan} disabled={loading} class="mt-4 w-full sm:w-auto">
        {loading ? 'Menyimpan...' : 'Simpan Draft'}
      </Button>
      <p class="mt-2 text-xs text-muted-foreground">
        Jurnal baru berubah jadi <strong class="text-foreground">submitted</strong> saat Anda menekan
        Selesai Mengajar di dashboard.
      </p>
    </Card>
  {/if}
</div>
