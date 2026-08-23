<script lang="ts">
  import { setActiveTahunAjaran, type TahunAjaran } from '../data/tahun-ajaran'
  import TahunAjaranForm from './TahunAjaranForm.svelte'

  interface Props {
    tahunAjaran: TahunAjaran[]
  }

  let { tahunAjaran }: Props = $props()
  let showForm = $state(false)
  let error = $state('')

  async function loadTahunAjaran() {
    window.location.reload()
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
    Tambah Tahun Ajaran
  </button>

  {#if showForm}
    <TahunAjaranForm onclose={handleCloseForm} />
  {/if}

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
                    onclick={() => handleSetActive(item.id)}
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
</div>

