<script lang="ts">
  import { listSiswa, deleteSiswa, type Siswa } from '../data/siswa'
  import SiswaForm from './SiswaForm.svelte'

  let siswa: Siswa[] = []
  let showForm = false
  let loading = true
  let error = ''

  async function loadSiswa() {
    loading = true
    try {
      siswa = await listSiswa()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load siswa'
    } finally {
      loading = false
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus siswa ini?')) return

    try {
      await deleteSiswa(id)
      await loadSiswa()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete siswa'
    }
  }

  function handleCloseForm() {
    showForm = false
    loadSiswa()
  }

  loadSiswa()
</script>

<div class="space-y-4">
  {#if error}
    <div class="rounded-md bg-red-50 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  <button
    on:click={() => (showForm = true)}
    class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
  >
    Tambah Siswa
  </button>

  {#if showForm}
    <SiswaForm on:close={handleCloseForm} />
  {/if}

  {#if loading}
    <p class="text-gray-600">Loading...</p>
  {:else}
    <div class="overflow-x-auto rounded-md border border-gray-200">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Nama</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Email</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">NIS</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Paket</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each siswa as item (item.id)}
            <tr>
              <td class="px-6 py-4 text-sm text-gray-900">{item.nama_lengkap}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{item.email}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{item.nis}</td>
              <td class="px-6 py-4 text-sm">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  class:bg-blue-100={item.paket === 'regular'}
                  class:text-blue-800={item.paket === 'regular'}
                  class:bg-purple-100={item.paket === 'privat'}
                  class:text-purple-800={item.paket === 'privat'}
                >
                  {item.paket === 'regular' ? 'Regular' : 'Privat'}
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                <button
                  on:click={() => handleDelete(item.id)}
                  class="text-red-600 hover:text-red-900"
                >
                  Hapus
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
