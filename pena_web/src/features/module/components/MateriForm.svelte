<script lang="ts">
  import { enhance } from '$app/forms'
  import { type Materi } from '../data/materi.ts'

  interface Props {
    mapelId: string
    editingMateri?: Materi
    onclose?: () => void
  }

  let { mapelId, editingMateri, onclose }: Props = $props()

  let nama = $state(editingMateri?.nama || '')
  let nomor_urut = $state(editingMateri?.nomor_urut || '')
  let loading = $state(false)
  let error = $state('')
</script>

<div class="rounded-2xl border border-gray-200 bg-white p-6">
  <h3 class="text-base font-semibold text-gray-900 mb-4">
    {editingMateri ? 'Edit Materi' : 'Tambah Materi'}
  </h3>

  {#if error}
    <div class="mb-4 rounded-lg bg-red-50 p-4">
      <p class="text-sm text-red-700">{error}</p>
    </div>
  {/if}

  <form method="POST" action={editingMateri ? '?/update' : '?/create'} use:enhance={({ formData }) => {
    if (editingMateri) {
      formData.set('materi_id', editingMateri.id)
    }
    formData.set('mapel_id', mapelId)
    loading = true
    return async ({ result }) => {
      loading = false
      if (result.type === 'success') {
        onclose?.()
      } else if (result.type === 'failure') {
        error = result.data?.error || (editingMateri ? 'Gagal memperbarui materi' : 'Gagal membuat materi')
      }
    }
  }} class="space-y-4">
    <div>
      <label for="nama" class="block text-sm text-gray-700 font-medium mb-1">
        Nama Materi
      </label>
      <input
        id="nama"
        name="nama"
        type="text"
        required
        bind:value={nama}
        class="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
    </div>

    <div>
      <label for="nomor_urut" class="block text-sm text-gray-700 font-medium mb-1">
        Nomor Urut
      </label>
      <input
        id="nomor_urut"
        name="nomor_urut"
        type="number"
        min="1"
        required
        bind:value={nomor_urut}
        class="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
    </div>

    <div class="flex gap-3 pt-2">
      <button
        type="submit"
        disabled={loading}
        class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? (editingMateri ? 'Updating...' : 'Creating...') : 'Simpan'}
      </button>
      <button
        type="button"
        onclick={() => onclose?.()}
        class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Batal
      </button>
    </div>
  </form>
</div>
