<script lang="ts">
  import { createTahunAjaran } from '../data/tahun-ajaran'

  interface Props {
    onclose?: () => void
  }

  let { onclose }: Props = $props()
  let nama = $state('')
  let loading = $state(false)
  let error = $state('')

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    loading = true
    error = ''

    try {
      await createTahunAjaran(nama)
      onclose?.()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save'
    } finally {
      loading = false
    }
  }
</script>

<div class="rounded-md border border-gray-200 bg-white p-6">
  <h3 class="text-lg font-medium text-gray-900 mb-4">
    Tambah Tahun Ajaran
  </h3>

  {#if error}
    <div class="mb-4 rounded-md bg-red-50 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="nama" class="block text-sm font-medium text-gray-700">
        Nama Tahun Ajaran (e.g., 2025/2026)
      </label>
      <input
        id="nama"
        type="text"
        placeholder="2025/2026"
        required
        bind:value={nama}
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
      />
    </div>

    <div class="flex space-x-3">
      <button
        type="submit"
        disabled={loading}
        class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Simpan'}
      </button>
      <button
        type="button"
        onclick={() => onclose?.()}
        class="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
      >
        Batal
      </button>
    </div>
  </form>
</div>

