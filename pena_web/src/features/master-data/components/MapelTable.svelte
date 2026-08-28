<script lang="ts">
  import { deleteMapel, type Mapel } from '../data/mapel'
  import MapelForm from './MapelForm.svelte'

  interface Props {
    mapel: (Mapel & { kelas_nama?: string[] })[]
  }

  let { mapel }: Props = $props()
  let showForm = $state(false)
  let editingMapel = $state<Mapel | null>(null)
  let error = $state('')

  async function loadMapel() {
    window.location.reload()
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus mapel ini?')) return

    try {
      await deleteMapel(id)
      await loadMapel()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete mapel'
    }
  }

  function handleEdit(item: Mapel) {
    editingMapel = item
    showForm = true
  }

  function handleCloseForm() {
    showForm = false
    editingMapel = null
    loadMapel()
  }
</script>

<div class="space-y-4">
  {#if error}
    <div class="rounded-lg bg-red-100 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  <button
    onclick={() => {
      editingMapel = null
      showForm = true
    }}
    class="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
  >
    Tambah Mapel
  </button>

  {#if showForm}
    {#key editingMapel?.id ?? 'new'}
      <MapelForm initial={editingMapel} onclose={handleCloseForm} />
    {/key}
  {/if}

  <div class="overflow-x-auto rounded-lg border border-border">
    <table class="w-full divide-y divide-border">
      <thead class="bg-muted/30">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Nama Mapel</th>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Kelas</th>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        {#each mapel as item (item.id)}
          <tr>
            <td class="px-4 py-3 text-sm font-medium text-foreground">{item.nama}</td>
            <td class="px-4 py-3 text-sm text-foreground">
              {#if item.kelas_nama && item.kelas_nama.length > 0}
                <div class="flex flex-wrap gap-1">
                  {#each item.kelas_nama as nama}
                    <span class="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                      {nama}
                    </span>
                  {/each}
                </div>
              {:else}
                <span class="text-xs text-muted-foreground">Belum terhubung ke kelas</span>
              {/if}
            </td>
            <td class="px-4 py-3 text-sm space-x-2">
              <button onclick={() => handleEdit(item)} class="text-primary hover:underline">
                Edit
              </button>
              <button onclick={() => handleDelete(item.id)} class="text-destructive hover:underline">
                Hapus
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
