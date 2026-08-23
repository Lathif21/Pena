<script lang="ts">
  import { deleteKelas, type Kelas } from '../data/kelas'
  import KelasForm from './KelasForm.svelte'

  interface Props {
    kelas: Kelas[]
  }

  let { kelas }: Props = $props()
  let showForm = $state(false)
  let editingKelas: Kelas | null = null
  let error = $state('')

  async function loadKelas() {
    window.location.reload()
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus kelas ini?')) return

    try {
      await deleteKelas(id)
      await loadKelas()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete kelas'
    }
  }

  function handleEdit(item: Kelas) {
    editingKelas = item
    showForm = true
  }

  function handleCloseForm() {
    showForm = false
    editingKelas = null
    loadKelas()
  }

  function handleFormClose() {
    handleCloseForm()
  }
</script>

<div class="space-y-4">
  {#if error}
    <div class="rounded-md bg-red-50 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  <button
    onclick={() => (showForm = true)}
    class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
  >
    Tambah Kelas
  </button>

  {#if showForm}
    <KelasForm initial={editingKelas} onclose={handleFormClose} />
  {/if}

  <div class="overflow-x-auto rounded-md border border-gray-200">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Nama</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each kelas as item (item.id)}
            <tr>
              <td class="px-6 py-4 text-sm text-gray-900">{item.nama}</td>
              <td class="px-6 py-4 text-sm space-x-2">
                <button
                  onclick={() => handleEdit(item)}
                  class="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </button>
                <button
                  onclick={() => handleDelete(item.id)}
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
</div>

