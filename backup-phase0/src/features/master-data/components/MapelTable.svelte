<script lang="ts">
  import { listMapel, deleteMapel, type Mapel } from '../data/mapel'
  import MapelForm from './MapelForm.svelte'

  let mapel: Mapel[] = []
  let showForm = false
  let editingMapel: Mapel | null = null
  let loading = true
  let error = ''

  async function loadMapel() {
    loading = true
    try {
      mapel = await listMapel()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load mapel'
    } finally {
      loading = false
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus mapel ini?')) return

    try {
      await deleteMapel(id)
      await loadMapel()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete mapel'
    }
  }

  function handleEdit(item: Mapel) {
    editingMapel = item
    showForm = true
  }

  function handleCloseForm() {
    showForm = false
    editingMapel = null
    loadMapel()
  }

  loadMapel()
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
    Tambah Mapel
  </button>

  {#if showForm}
    <MapelForm initial={editingMapel} on:close={handleCloseForm} />
  {/if}

  {#if loading}
    <p class="text-gray-600">Loading...</p>
  {:else}
    <div class="overflow-x-auto rounded-md border border-gray-200">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Nama</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each mapel as item (item.id)}
            <tr>
              <td class="px-6 py-4 text-sm text-gray-900">{item.nama}</td>
              <td class="px-6 py-4 text-sm space-x-2">
                <button
                  on:click={() => handleEdit(item)}
                  class="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </button>
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
