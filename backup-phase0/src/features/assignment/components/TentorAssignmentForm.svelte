<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { createTentorAssignment } from '../data/tentor-assignment'
  import { listTentor, type Tentor } from '$features/account/data/tentor'
  import { listKelas, type Kelas } from '$features/master-data/data/kelas'
  import { listMapel, type Mapel } from '$features/master-data/data/mapel'

  export let tahun_ajaran_id: string

  const dispatch = createEventDispatcher()
  let tentor_id = ''
  let kelas_id = ''
  let mapel_id = ''

  let tentor_list: Tentor[] = []
  let kelas_list: Kelas[] = []
  let mapel_list: Mapel[] = []

  let loading = false
  let loadingData = true
  let error = ''

  async function loadData() {
    loadingData = true
    try {
      ;[tentor_list, kelas_list, mapel_list] = await Promise.all([
        listTentor(),
        listKelas(),
        listMapel()
      ])
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
      await createTentorAssignment(tentor_id, kelas_id, mapel_id, tahun_ajaran_id)
      dispatch('close')
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to create assignment'
    } finally {
      loading = false
    }
  }

  loadData()
</script>

<div class="rounded-md border border-gray-200 bg-white p-6">
  <h3 class="text-lg font-medium text-gray-900 mb-4">
    Tambah Assignment Tentor
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
        <label for="tentor" class="block text-sm font-medium text-gray-700">
          Tentor
        </label>
        <select
          id="tentor"
          required
          bind:value={tentor_id}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Pilih Tentor</option>
          {#each tentor_list as t (t.id)}
            <option value={t.id}>{t.nama_lengkap}</option>
          {/each}
        </select>
      </div>

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

      <div>
        <label for="mapel" class="block text-sm font-medium text-gray-700">
          Mata Pelajaran
        </label>
        <select
          id="mapel"
          required
          bind:value={mapel_id}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Pilih Mapel</option>
          {#each mapel_list as m (m.id)}
            <option value={m.id}>{m.nama}</option>
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
