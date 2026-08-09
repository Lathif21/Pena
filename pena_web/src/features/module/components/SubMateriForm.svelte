<script lang="ts">
  import { enhance } from '$app/forms'
  import { type SubMateri } from '../data/sub-materi.ts'

  interface Props {
    materiId: string
    editingSubMateri?: SubMateri
    onclose?: () => void
  }

  let { materiId, editingSubMateri, onclose }: Props = $props()

  let nama = $state(editingSubMateri?.nama || '')
  let nomor_urut = $state(editingSubMateri?.nomor_urut || '')
  let loading = $state(false)
  let error = $state('')
</script>

<div class="rounded-2xl border border-gray-200 bg-white p-6">
  <h3 class="text-base font-semibold text-gray-900 mb-4">
    {editingSubMateri ? 'Edit Sub Materi' : 'Tambah Sub Materi'}
  </h3>

  {#if error}
    <div class="mb-4 rounded-lg bg-red-50 p-4">
      <p class="text-sm text-red-700">{error}</p>
    </div>
  {/if}

  <form method="POST" action={editingSubMateri ? '?/update' : '?/create'} use:enhance={({ formData }) => {
    if (editingSubMateri) {
      formData.set('sub_materi_id', editingSubMateri.id)
    }
    formData.set('materi_id', materiId)
    loading = true
    return async ({ result }) => {
      loading = false
      if (result.type === 'success') {
        onclose?.()
      } else if (result.type === 'failure') {
        error = result.data?.error || (editingSubMateri ? 'Gagal memperbarui sub materi' : 'Gagal membuat sub materi')
      }
    }
  }} class="space-y-4">
    <div>
      <label for="nama" class="block text-sm text-gray-700 font-medium mb-1">
        Nama Sub Materi
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
        class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {loading ? (editingSubMateri ? 'Updating...' : 'Creating...') : 'Simpan'}
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
