<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { createSiswa } from '../data/siswa'
  import { listKelas, type Kelas } from '$features/master-data/data/kelas'
  import { listMapel, type Mapel } from '$features/master-data/data/mapel'
  import { listTentor, type Tentor } from '../data/tentor'
  import { listTahunAjaran, type TahunAjaran } from '$features/master-data/data/tahun-ajaran'

  const dispatch = createEventDispatcher()
  let nama_lengkap = ''
  let email = ''
  let password = ''
  let nis = ''
  let paket: 'regular' | 'privat' = 'regular'
  let kelas_id = ''
  let selectedTentorMapel: Array<{ tentor_id: string; mapel_id: string }> = []

  let kelas_list: Kelas[] = []
  let mapel_list: Mapel[] = []
  let tentor_list: Tentor[] = []
  let tahun_ajaran_list: TahunAjaran[] = []
  let tahun_ajaran_id = ''

  let loading = false
  let loadingData = true
  let error = ''

  async function loadData() {
    loadingData = true
    try {
      ;[kelas_list, mapel_list, tentor_list, tahun_ajaran_list] = await Promise.all([
        listKelas(),
        listMapel(),
        listTentor(),
        listTahunAjaran()
      ])
      // Auto-select active tahun ajaran
      const active = tahun_ajaran_list.find((ta) => ta.is_active)
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
      const tentor_mapel = selectedTentorMapel.length > 0 ? selectedTentorMapel : undefined
      await createSiswa(
        nama_lengkap,
        email,
        password,
        nis,
        paket,
        tahun_ajaran_id,
        paket === 'regular' ? kelas_id : undefined,
        paket === 'privat' ? tentor_mapel : undefined
      )
      dispatch('close')
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create siswa'
    } finally {
      loading = false
    }
  }

  function generateNIS() {
    nis = Math.random().toString().slice(2, 10)
  }

  loadData()
</script>

<div class="rounded-md border border-gray-200 bg-white p-6">
  <h3 class="text-lg font-medium text-gray-900 mb-4">
    Tambah Siswa
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

      <div class="flex space-x-2">
        <div class="flex-1">
          <label for="nis" class="block text-sm font-medium text-gray-700">
            NIS
          </label>
          <input
            id="nis"
            type="text"
            required
            bind:value={nis}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div class="flex items-end">
          <button
            type="button"
            on:click={generateNIS}
            class="rounded-md bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
          >
            Generate
          </button>
        </div>
      </div>

      <div>
        <label for="paket" class="block text-sm font-medium text-gray-700">
          Paket
        </label>
        <select
          id="paket"
          bind:value={paket}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="regular">Regular (Kelas)</option>
          <option value="privat">Privat (Tentor)</option>
        </select>
      </div>

      {#if paket === 'regular'}
        <div>
          <label for="kelas" class="block text-sm font-medium text-gray-700">
            Kelas
          </label>
          <select
            id="kelas"
            required
            bind:value={kelas_id}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Pilih Kelas</option>
            {#each kelas_list as k (k.id)}
              <option value={k.id}>{k.nama}</option>
            {/each}
          </select>
        </div>
      {/if}

      {#if paket === 'privat'}
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Tentor & Mata Pelajaran
          </label>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            {#each tentor_list as t (t.id)}
              <div class="flex items-center space-x-4 border-b pb-2">
                <span class="text-sm text-gray-700 flex-1">{t.nama_lengkap}</span>
                <select
                  class="rounded-md border border-gray-300 px-2 py-1 text-sm"
                  on:change={(e) => {
                    const mapel_id = e.currentTarget.value
                    if (mapel_id) {
                      selectedTentorMapel = [
                        ...selectedTentorMapel.filter((tm) => tm.tentor_id !== t.id),
                        { tentor_id: t.id, mapel_id }
                      ]
                    } else {
                      selectedTentorMapel = selectedTentorMapel.filter((tm) => tm.tentor_id !== t.id)
                    }
                  }}
                >
                  <option value="">Pilih Mapel</option>
                  {#each mapel_list as m (m.id)}
                    <option value={m.id}>{m.nama}</option>
                  {/each}
                </select>
              </div>
            {/each}
          </div>
        </div>
      {/if}

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
