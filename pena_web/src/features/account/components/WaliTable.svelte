<script lang="ts">
  import { deleteWali, type Wali } from '../data/wali'
  import WaliForm from './WaliForm.svelte'

  interface Props {
    wali: Wali[]
  }

  let { wali }: Props = $props()
  let showForm = $state(false)
  let editingWali: Wali | null = $state(null)
  let error = $state('')

  async function loadWali() {
    window.location.reload()
  }

  function handleEditClick(item: Wali) {
    editingWali = item
    showForm = true
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus wali ini?')) return

    try {
      await deleteWali(id)
      await loadWali()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete wali'
    }
  }

  function handleCloseForm() {
    showForm = false
    editingWali = null
    loadWali()
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
    Tambah Wali Murid
  </button>

  {#if showForm}
    <WaliForm editingWali={editingWali} onclose={handleCloseForm} />
  {/if}

  <div class="overflow-x-auto rounded-md border border-gray-200">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Nama</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Email</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each wali as item (item.id)}
            <tr>
              <td class="px-6 py-4 text-sm text-gray-900">{item.nama_lengkap}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{item.email}</td>
              <td class="px-6 py-4 text-sm space-x-3">
                <button
                  onclick={() => handleEditClick(item)}
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

