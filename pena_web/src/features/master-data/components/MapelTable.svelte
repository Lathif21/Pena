<script lang="ts">
  import { deleteMapel, type Mapel } from '../data/mapel'
  import MapelForm from './MapelForm.svelte'

  interface Props {
    mapel: (Mapel & { kelas_nama?: string[] })[]
  }

  let { mapel }: Props = $props()
  let showForm = $state(false)
  let editingMapel = $state<Mapel | null>(null)
  let error = $state('')

  async function loadMapel() {
    window.location.reload()
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
</script>

<div class="space-y-4">
  {#if error}
    <div class="rounded-md bg-red-50 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  <button
    onclick={() => {
      editingMapel = null
      showForm = true
    }}
    class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
  >
    Tambah Mapel
  </button>

  {#if showForm}
    {#key editingMapel?.id ?? 'new'}
      <MapelForm initial={editingMapel} onclose={handleCloseForm} />
    {/key}
  {/if}

  <div class="overflow-x-auto rounded-md border border-gray-200">
    <table class="w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Nama Mapel</th>
          <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Kelas</th>
          <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        {#each mapel as item (item.id)}
          <tr>
            <td class="px-6 py-4 text-sm font-medium text-gray-900">{item.nama}</td>
            <td class="px-6 py-4 text-sm text-gray-700">
              {#if item.kelas_nama && item.kelas_nama.length > 0}
                <div class="flex flex-wrap gap-1">
                  {#each item.kelas_nama as nama}
                    <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {nama}
                    </span>
                  {/each}
                </div>
              {:else}
                <span class="text-xs text-gray-400">Belum terhubung ke kelas</span>
              {/if}
            </td>
            <td class="px-6 py-4 text-sm space-x-2">
              <button onclick={() => handleEdit(item)} class="text-primary hover:text-primary-hover">
                Edit
              </button>
              <button onclick={() => handleDelete(item.id)} class="text-danger hover:text-red-700">
                Hapus
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
