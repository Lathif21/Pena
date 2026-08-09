<script lang="ts">
  import { listTentor, deleteTentor, type Tentor } from '../data/tentor'
  import TentorForm from './TentorForm.svelte'

  let tentor: Tentor[] = []
  let showForm = false
  let loading = true
  let error = ''

  async function loadTentor() {
    loading = true
    try {
      tentor = await listTentor()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load tentor'
    } finally {
      loading = false
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus tentor ini?')) return

    try {
      await deleteTentor(id)
      await loadTentor()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete tentor'
    }
  }

  function handleCloseForm() {
    showForm = false
    loadTentor()
  }

  loadTentor()
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
    Tambah Tentor
  </button>

  {#if showForm}
    <TentorForm on:close={handleCloseForm} />
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
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each tentor as item (item.id)}
            <tr>
              <td class="px-6 py-4 text-sm text-gray-900">{item.nama_lengkap}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{item.email}</td>
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
