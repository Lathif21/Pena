<script lang="ts">
  import { listMateri, softDeleteMateri, type Materi } from '../data/materi.ts'
  import MateriForm from './MateriForm.svelte'

  interface Props {
    mapelId: string
    mapelNama: string
  }

  let { mapelId, mapelNama }: Props = $props()

  let materi = $state<Materi[]>([])
  let showForm = $state(false)
  let editingMateri: Materi | null = $state(null)
  let loading = $state(true)
  let error = $state('')

  async function loadMateri() {
    loading = true
    try {
      materi = await listMateri(mapelId)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load materi'
    } finally {
      loading = false
    }
  }

  function handleEditClick(item: Materi) {
    editingMateri = item
    showForm = true
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus materi ini?')) return
    try {
      await softDeleteMateri(id)
      await loadMateri()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete materi'
    }
  }

  function handleCloseForm() {
    showForm = false
    editingMateri = null
    loadMateri()
  }

  $effect(() => {
    loadMateri()
  })
</script>

<div class="space-y-6">
  {#if error}
    <div class="rounded-lg bg-red-50 p-4">
      <p class="text-sm text-red-700">{error}</p>
    </div>
  {/if}

  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">{mapelNama}</h1>
      <p class="text-sm text-gray-500 mt-1">Kelola materi untuk mata pelajaran ini</p>
    </div>
    <button
      onclick={() => {
        editingMateri = null
        showForm = true
      }}
      class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
    >
      Tambah Materi
    </button>
  </div>

  {#if showForm}
    <MateriForm {mapelId} {editingMateri} onclose={handleCloseForm} />
  {/if}

  {#if loading}
    <p class="text-sm text-gray-500">Loading...</p>
  {:else if materi.length === 0}
    <div class="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
      <p class="text-sm text-gray-500">Belum ada materi. Tambahkan materi pertama untuk mulai.</p>
    </div>
  {:else}
    <div class="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Urutan</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nama</th>
            <th class="px-6 py-3 text-right text-sm font-semibold text-gray-900">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {#each materi as item (item.id)}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-900">{item.nomor_urut}</td>
              <td class="px-6 py-4 text-sm">
                <a href="/kepala-guru/konten/{mapelId}/materi/{item.id}" class="text-primary hover:text-primary-hover font-medium">
                  {item.nama}
                </a>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  onclick={() => handleEditClick(item)}
                  class="text-sm text-primary hover:text-primary-hover font-medium"
                >
                  Edit
                </button>
                <span class="text-gray-300 mx-2">·</span>
                <button
                  onclick={() => handleDelete(item.id)}
                  class="text-sm text-danger hover:text-red-700 font-medium"
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
