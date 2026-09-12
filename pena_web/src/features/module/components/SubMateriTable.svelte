<script lang="ts">
  import { pesanRamah } from '$lib/utils/pesan'
  import { listSubMateri, softDeleteSubMateri, type SubMateri } from '../data/sub-materi.ts'
  import SubMateriForm from './SubMateriForm.svelte'
  import { FileText } from 'lucide-svelte'

  interface Props {
    materiId: string
    materiNama: string
    mapelId: string
  }

  let { materiId, materiNama, mapelId }: Props = $props()

  let submateri = $state<SubMateri[]>([])
  let showForm = $state(false)
  let editingSubMateri: SubMateri | null = $state(null)
  let loading = $state(true)
  let error = $state('')

  async function loadSubMateri() {
    loading = true
    try {
      submateri = await listSubMateri(materiId)
    } catch (err) {
      error = pesanRamah(err, 'Gagal memuat sub materi.')
    } finally {
      loading = false
    }
  }

  function handleEditClick(item: SubMateri) {
    editingSubMateri = item
    showForm = true
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus sub materi ini?')) return
    try {
      await softDeleteSubMateri(id)
      await loadSubMateri()
    } catch (err) {
      error = pesanRamah(err, 'Gagal menghapus sub materi.')
    }
  }

  function handleCloseForm() {
    showForm = false
    editingSubMateri = null
    loadSubMateri()
  }

  $effect(() => {
    loadSubMateri()
  })
</script>

<div class="space-y-6">
  {#if error}
    <div class="rounded-lg bg-red-100 p-4">
      <p class="text-sm text-red-800">{error}</p>
    </div>
  {/if}

  <div class="flex items-center justify-between">

    <button
      onclick={() => {
        editingSubMateri = null
        showForm = true
      }}
      class="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      Tambah Sub Materi
    </button>
  </div>

  {#if showForm}
    <SubMateriForm {materiId} {editingSubMateri} onclose={handleCloseForm} />
  {/if}

  {#if loading}
    <p class="text-sm text-muted-foreground">Loading...</p>
  {:else if submateri.length === 0}
    <div class="rounded-xl border border-dashed border-border p-8 text-center">
      <FileText class="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">Belum ada sub materi. Tambahkan sub materi pertama untuk mulai.</p>
    </div>
  {:else}
    <div class="overflow-x-auto rounded-xl border border-border bg-card">
      <table class="w-full">
        <thead>
          <tr class="border-b border-border">
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Urutan</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Nama</th>
            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each submateri as item (item.id)}
            <tr class="hover:bg-muted/30">
              <td class="px-4 py-3 font-mono text-sm text-foreground">{item.nomor_urut}</td>
              <td class="px-4 py-3 text-sm">
                <a href="/kepala-guru/konten/{mapelId}/materi/{materiId}/{item.id}/module" class="text-primary hover:underline font-medium">
                  {item.nama}
                </a>
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  onclick={() => handleEditClick(item)}
                  class="text-sm text-primary hover:underline font-medium"
                >
                  Edit
                </button>
                <span class="mx-2 text-muted-foreground/50">·</span>
                <button
                  onclick={() => handleDelete(item.id)}
                  class="text-sm text-destructive hover:underline font-medium"
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
