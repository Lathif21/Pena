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

<div class="rounded-xl border border-border bg-card p-5">
  <h3 class="mb-4 font-serif text-lg text-foreground">
    Tambah Tahun Ajaran
  </h3>

  {#if error}
    <div class="mb-4 rounded-lg bg-red-100 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="nama" class="block text-sm font-medium text-foreground">
        Nama Tahun Ajaran (e.g., 2025/2026)
      </label>
      <input
        id="nama"
        type="text"
        placeholder="2025/2026"
        required
        bind:value={nama}
        class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
      />
    </div>

    <div class="flex space-x-3">
      <button
        type="submit"
        disabled={loading}
        class="rounded-lg bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Simpan'}
      </button>
      <button
        type="button"
        onclick={() => onclose?.()}
        class="rounded-lg border border-border px-4 py-2 text-foreground hover:bg-muted/30"
      >
        Batal
      </button>
    </div>
  </form>
</div>

