<script lang="ts">
  import { listTahunAjaran, setActiveTahunAjaran, type TahunAjaran } from '../data/tahun-ajaran'
  import TahunAjaranForm from './TahunAjaranForm.svelte'

  let tahunAjaran: TahunAjaran[] = []
  let showForm = false
  let loading = true
  let error = ''

  async function loadTahunAjaran() {
    loading = true
    try {
      tahunAjaran = await listTahunAjaran()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load tahun ajaran'
    } finally {
      loading = false
    }
  }

  async function handleSetActive(id: string) {
    try {
      await setActiveTahunAjaran(id)
      await loadTahunAjaran()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to set active'
    }
  }

  function handleCloseForm() {
    showForm = false
    loadTahunAjaran()
  }

  loadTahunAjaran()
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
    Tambah Tahun Ajaran
  </button>

  {#if showForm}
    <TahunAjaranForm on:close={handleCloseForm} />
  {/if}

  {#if loading}
    <p class="text-gray-600">Loading...</p>
  {:else}
    <div class="overflow-x-auto rounded-md border border-gray-200">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Nama</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each tahunAjaran as item (item.id)}
            <tr>
              <td class="px-6 py-4 text-sm text-gray-900">{item.nama}</td>
              <td class="px-6 py-4 text-sm">
                {#if item.is_active}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Aktif
                  </span>
                {:else}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Tidak Aktif
                  </span>
                {/if}
              </td>
              <td class="px-6 py-4 text-sm">
                {#if !item.is_active}
                  <button
                    on:click={() => handleSetActive(item.id)}
                    class="text-blue-600 hover:text-blue-900"
                  >
                    Aktifkan
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
