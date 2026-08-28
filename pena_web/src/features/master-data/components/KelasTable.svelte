<script lang="ts">
  import { deleteKelas, type Kelas } from '../data/kelas'
  import KelasForm from './KelasForm.svelte'

  interface Props {
    kelas: Kelas[]
  }

  let { kelas }: Props = $props()
  let showForm = $state(false)
  let editingKelas: Kelas | null = null
  let error = $state('')

  async function loadKelas() {
    window.location.reload()
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus kelas ini?')) return

    try {
      await deleteKelas(id)
      await loadKelas()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete kelas'
    }
  }

  function handleEdit(item: Kelas) {
    editingKelas = item
    showForm = true
  }

  function handleCloseForm() {
    showForm = false
    editingKelas = null
    loadKelas()
  }

  function handleFormClose() {
    handleCloseForm()
  }
</script>

<div class="space-y-4">
  {#if error}
    <div class="rounded-lg bg-red-100 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  <button
    onclick={() => (showForm = true)}
    class="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
  >
    Tambah Kelas
  </button>

  {#if showForm}
    <KelasForm initial={editingKelas} onclose={handleFormClose} />
  {/if}

  <div class="overflow-x-auto rounded-lg border border-border">
      <table class="w-full divide-y divide-border">
        <thead class="bg-muted/30">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Nama</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each kelas as item (item.id)}
            <tr>
              <td class="px-4 py-3 text-sm text-foreground">{item.nama}</td>
              <td class="px-4 py-3 text-sm space-x-2">
                <button
                  onclick={() => handleEdit(item)}
                  class="text-primary hover:underline"
                >
                  Edit
                </button>
                <button
                  onclick={() => handleDelete(item.id)}
                  class="text-destructive hover:underline"
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

