<script lang="ts">
  import { pesanRamah } from '$lib/utils/pesan'
  import { listMateri, softDeleteMateri, type Materi } from '../data/materi.ts'
  import MateriForm from './MateriForm.svelte'
  import { BookOpen } from 'lucide-svelte'

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
      error = pesanRamah(err, 'Gagal memuat materi.')
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
      error = pesanRamah(err, 'Gagal menghapus materi.')
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
    <div class="rounded-lg bg-red-100 p-4">
      <p class="text-sm text-red-800">{error}</p>
    </div>
  {/if}

  <div class="flex items-center justify-between">
    <div>
      <h1 class="font-serif text-2xl text-foreground">{mapelNama}</h1>
      <p class="text-sm text-muted-foreground mt-1">Kelola materi untuk mata pelajaran ini</p>
    </div>
    <button
      onclick={() => {
        editingMateri = null
        showForm = true
      }}
      class="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      Tambah Materi
    </button>
  </div>

  {#if showForm}
    <MateriForm {mapelId} {editingMateri} onclose={handleCloseForm} />
  {/if}

  {#if loading}
    <p class="text-sm text-muted-foreground">Loading...</p>
  {:else if materi.length === 0}
    <div class="rounded-xl border border-dashed border-border p-8 text-center">
      <BookOpen class="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">Belum ada materi. Tambahkan materi pertama untuk mulai.</p>
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
          {#each materi as item (item.id)}
            <tr class="hover:bg-muted/30">
              <td class="px-4 py-3 font-mono text-sm text-foreground">{item.nomor_urut}</td>
              <td class="px-4 py-3 text-sm">
                <a href="/kepala-guru/konten/{mapelId}/materi/{item.id}" class="text-primary hover:underline font-medium">
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
