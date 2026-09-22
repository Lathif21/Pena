<script lang="ts">
  import { pesanRamah } from '$lib/utils/pesan'
  import { enhance } from '$app/forms'
  import { listSiswa, type Siswa } from '../data/siswa'
  import { listSiswaIdsForWali } from '../data/wali'
  import { listTahunAjaran, type TahunAjaran } from '$features/master-data/data/tahun-ajaran'

  interface Props {
    editingWali?: { id: string; nama_lengkap: string; email: string }
    onclose?: (tersimpan?: boolean) => void
  }

  let { editingWali, onclose }: Props = $props()

  $effect.pre(() => {
    if (editingWali) {
      loadWaliSiswa(editingWali.id)
    }
  })
  let nama_lengkap = $state(editingWali?.nama_lengkap || '')
  let email = $state(editingWali?.email || '')
  let password = $state('')
  let tahun_ajaran_id = $state('')
  let selectedSiswaIds: string[] = []

  let siswa_list: Array<Siswa & { siswa_detail_id?: string }> = []
  let tahun_ajaran_list: TahunAjaran[] = []

  let loading = $state(false)
  let loadingData = $state(true)
  let error = $state('')

  async function loadData() {
    loadingData = true
    try {
      const [siswa, tahun] = await Promise.all([listSiswa(), listTahunAjaran()])
      siswa_list = siswa
      tahun_ajaran_list = tahun
      const active = tahun.find((ta) => ta.is_active)
      if (active) tahun_ajaran_id = active.id

      // If editing, load the wali's current siswa
      if (editingWali) {
        await loadWaliSiswa(editingWali.id)
      }
    } catch (err) {
      error = pesanRamah(err, 'Gagal memuat data. Coba muat ulang halaman.')
    } finally {
      loadingData = false
    }
  }

  async function loadWaliSiswa(waliId: string) {
    try {
      selectedSiswaIds = await listSiswaIdsForWali(waliId)
    } catch (err) {
      console.error('Gagal memuat data anak wali:', err)
    }
  }

  loadData()
</script>

<div class="rounded-xl border border-border bg-card p-5">
  <h3 class="mb-4 font-serif text-lg text-foreground">
    {editingWali ? 'Edit Wali Murid' : 'Tambah Wali Murid'}
  </h3>

  {#if error}
    <div class="mb-4 rounded-lg bg-red-100 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  {#if loadingData}
    <p class="text-muted-foreground">Loading...</p>
  {:else}
    <form method="POST" action={editingWali ? '?/update' : '?/create'} use:enhance={({ formData }) => {
      if (editingWali) {
        formData.set('wali_id', editingWali.id)
      }
      formData.set('siswa_ids', JSON.stringify(selectedSiswaIds))
      loading = true
      return async ({ result }) => {
        loading = false
        if (result.type === 'success') {
          onclose?.(true)
        } else if (result.type === 'failure') {
          error = result.data?.error || (editingWali ? 'Gagal memperbarui wali' : 'Gagal membuat wali')
        }
      }
    }} class="space-y-4">
      <div>
        <label for="nama" class="block text-sm font-medium text-foreground">
          Nama Lengkap
        </label>
        <input
          id="nama"
          name="nama_lengkap"
          type="text"
          required
          bind:value={nama_lengkap}
          class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-8 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
        />
      </div>

      <div>
        <label for="email" class="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="text"
          required
          pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+"
          bind:value={email}
          class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-8 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
        />
      </div>

      {#if !editingWali}
        <div>
          <label for="password" class="block text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            bind:value={password}
            class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-8 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
          />
        </div>
      {/if}

      <div>
        <label class="block text-sm font-medium text-foreground mb-2">
          Pilih Anak (Siswa)
        </label>
        <div class="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
          {#each siswa_list as s (s.id)}
            <label class="flex items-center space-x-2">
              <input
                type="checkbox"
                value={s.siswa_detail_id}
                bind:group={selectedSiswaIds}
                class="rounded border-border"
              />
              <span class="text-sm text-foreground">
                {s.nama_lengkap} ({s.paket === 'regular' ? 'Regular' : 'Privat'})
              </span>
            </label>
          {/each}
        </div>
      </div>

      {#if !editingWali}
        <div>
          <label for="tahun" class="block text-sm font-medium text-foreground">
            Tahun Ajaran
          </label>
          <select
            id="tahun"
            name="tahun_ajaran_id"
            required
            bind:value={tahun_ajaran_id}
            class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-8 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
          >
            <option value="">Pilih Tahun Ajaran</option>
            {#each tahun_ajaran_list as ta (ta.id)}
              <option value={ta.id}>
                {ta.nama} {ta.is_active ? '(Aktif)' : ''}
              </option>
            {/each}
          </select>
        </div>
      {/if}

      <div class="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          class="rounded-lg bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (editingWali ? 'Updating...' : 'Creating...') : 'Simpan'}
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

