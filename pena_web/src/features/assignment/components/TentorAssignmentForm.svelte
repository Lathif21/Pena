<script lang="ts">
  import { pesanRamah } from '$lib/utils/pesan'
  import { enhance } from '$app/forms'
  import { listTentor, type Tentor } from '$features/account/data/tentor'
  import { listKelas, type Kelas } from '$features/master-data/data/kelas'
  import { listMapel, type Mapel } from '$features/master-data/data/mapel'

  interface Props {
    tahun_ajaran_id: string
    editingAssignment?: { id: string; tentor_id: string; kelas_id: string; mapel_id: string }
    onclose?: (tersimpan?: boolean) => void
  }

  let { tahun_ajaran_id, editingAssignment, onclose }: Props = $props()

  let tentor_id = $state(editingAssignment?.tentor_id || '')
  let kelas_id = $state(editingAssignment?.kelas_id || '')
  let mapel_id = $state(editingAssignment?.mapel_id || '')

  let tentor_list: Tentor[] = []
  let kelas_list: Kelas[] = []
  let mapel_list = $state<Mapel[]>([])

  // Hanya mapel yang dipakai kelas terpilih. Menawarkan seluruh mapel membuat
  // assignment ke mapel yang tidak diajarkan di kelas itu bisa tersimpan, lalu
  // diam-diam hilang dari dropdown presensi tentor karena tersaring di sana.
  const mapelTersedia = $derived(
    kelas_id ? mapel_list.filter((m) => m.kelas_ids?.includes(kelas_id)) : []
  )

  function pilihKelas(id: string) {
    kelas_id = id
    // Mapel yang sudah terpilih belum tentu ada di kelas yang baru.
    if (!mapel_list.find((m) => m.id === mapel_id)?.kelas_ids?.includes(id)) mapel_id = ''
  }

  let loading = $state(false)
  let loadingData = $state(true)
  let error = $state('')

  async function loadData() {
    loadingData = true
    error = ''
    try {
      const [t, k, m] = await Promise.all([listTentor(), listKelas(), listMapel()])
      tentor_list = t
      kelas_list = k
      mapel_list = m
    } catch (err) {
      error = pesanRamah(err, 'Gagal memuat data. Coba muat ulang halaman.')
      console.error('Error loading assignment data:', err)
    } finally {
      loadingData = false
    }
  }

  loadData()
</script>

<div class="rounded-xl border border-border bg-card p-5">
  <h3 class="mb-4 font-serif text-lg text-foreground">
    {editingAssignment ? 'Edit Assignment Tentor' : 'Tambah Assignment Tentor'}
  </h3>

  {#if error}
    <div class="mb-4 rounded-lg bg-red-100 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  {#if loadingData}
    <p class="text-muted-foreground">Loading...</p>
  {:else}
    <form method="POST" action={editingAssignment ? '?/update' : '?/create'} use:enhance={({ formData }) => {
      if (editingAssignment) {
        formData.set('assignment_id', editingAssignment.id)
      }
      formData.set('tahun_ajaran_id', tahun_ajaran_id)
      loading = true
      return async ({ result }) => {
        loading = false
        if (result.type === 'success') {
          onclose?.(true)
        } else if (result.type === 'failure') {
          error = result.data?.error || (editingAssignment ? 'Gagal memperbarui assignment' : 'Gagal membuat assignment')
        }
      }
    }} class="space-y-4">
      <div>
        <label for="tentor" class="block text-sm font-medium text-foreground">
          Tentor
        </label>
        <select
          id="tentor"
          name="tentor_id"
          required
          bind:value={tentor_id}
          class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
        >
          <option value="">Pilih Tentor</option>
          {#each tentor_list as t (t.id)}
            <option value={t.id}>{t.nama_lengkap}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="kelas" class="block text-sm font-medium text-foreground">
          Kelas
        </label>
        <select
          id="kelas"
          name="kelas_id"
          required
          value={kelas_id}
          onchange={(e) => pilihKelas((e.currentTarget as HTMLSelectElement).value)}
          class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
        >
          <option value="">Pilih Kelas</option>
          {#each kelas_list as k (k.id)}
            <option value={k.id}>{k.nama}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="mapel" class="block text-sm font-medium text-foreground">
          Mata Pelajaran
        </label>
        <select
          id="mapel"
          name="mapel_id"
          required
          disabled={!kelas_id}
          bind:value={mapel_id}
          class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none disabled:opacity-50"
        >
          <option value="">{kelas_id ? 'Pilih Mapel' : 'Pilih kelas dulu'}</option>
          {#each mapelTersedia as m (m.id)}
            <option value={m.id}>{m.nama}</option>
          {/each}
        </select>
        {#if kelas_id && mapelTersedia.length === 0}
          <p class="mt-1 text-xs text-amber-800">
            Kelas ini belum memakai mapel apa pun. Daftarkan dulu lewat Master Data &rarr; Mapel.
          </p>
        {/if}
      </div>

      <div class="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          class="rounded-lg bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (editingAssignment ? 'Updating...' : 'Creating...') : 'Simpan'}
        </button>
        <button
          type="button"
          onclick={() => onclose?.()}
          class="rounded-lg border border-border px-4 py-2 text-foreground hover:bg-muted/30"
        >
          Batal
        </button>
      </div>
    </form>
  {/if}
</div>

