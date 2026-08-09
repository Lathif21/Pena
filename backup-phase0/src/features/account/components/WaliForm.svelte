<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { createWali } from '../data/wali'
  import { listSiswa, type Siswa } from '../data/siswa'
  import { listTahunAjaran, type TahunAjaran } from '$features/master-data/data/tahun-ajaran'

  const dispatch = createEventDispatcher()
  let nama_lengkap = ''
  let email = ''
  let password = ''
  let tahun_ajaran_id = ''
  let selectedSiswaIds: string[] = []

  let siswa_list: Array<Siswa & { siswa_detail_id?: string }> = []
  let tahun_ajaran_list: TahunAjaran[] = []

  let loading = false
  let loadingData = true
  let error = ''

  async function loadData() {
    loadingData = true
    try {
      const [siswa, tahun] = await Promise.all([listSiswa(), listTahunAjaran()])
      siswa_list = siswa
      tahun_ajaran_list = tahun
      // Auto-select active tahun ajaran
      const active = tahun.find((ta) => ta.is_active)
      if (active) tahun_ajaran_id = active.id
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load data'
    } finally {
      loadingData = false
    }
  }

  async function handleSubmit() {
    loading = true
    error = ''

    try {
      await createWali(nama_lengkap, email, password, tahun_ajaran_id, selectedSiswaIds)
      dispatch('close')
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create wali'
    } finally {
      loading = false
    }
  }

  loadData()
</script>

<div class="rounded-md border border-gray-200 bg-white p-6">
  <h3 class="text-lg font-medium text-gray-900 mb-4">
    Tambah Wali Murid
  </h3>

  {#if error}
    <div class="mb-4 rounded-md bg-red-50 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  {#if loadingData}
    <p class="text-gray-600">Loading...</p>
  {:else}
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div>
        <label for="nama" class="block text-sm font-medium text-gray-700">
          Nama Lengkap
        </label>
        <input
          id="nama"
          type="text"
          required
          bind:value={nama_lengkap}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          bind:value={email}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          bind:value={password}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Pilih Anak (Siswa)
        </label>
        <div class="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
          {#each siswa_list as s (s.id)}
            <label class="flex items-center space-x-2">
              <input
                type="checkbox"
                value={s.id}
                bind:group={selectedSiswaIds}
                class="rounded border-gray-300"
              />
              <span class="text-sm text-gray-700">
                {s.nama_lengkap} ({s.paket === 'regular' ? 'Regular' : 'Privat'})
              </span>
            </label>
          {/each}
        </div>
      </div>

      <div>
        <label for="tahun" class="block text-sm font-medium text-gray-700">
          Tahun Ajaran
        </label>
        <select
          id="tahun"
          required
          bind:value={tahun_ajaran_id}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Pilih Tahun Ajaran</option>
          {#each tahun_ajaran_list as ta (ta.id)}
            <option value={ta.id}>
              {ta.nama} {ta.is_active ? '(Aktif)' : ''}
            </option>
          {/each}
        </select>
      </div>

      <div class="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Simpan'}
        </button>
        <button
          type="button"
          on:click={() => dispatch('close')}
          class="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </form>
  {/if}
</div>
