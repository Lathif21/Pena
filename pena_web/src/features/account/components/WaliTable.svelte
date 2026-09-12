<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { pesanRamah } from '$lib/utils/pesan'
  import { deleteWali, type Wali } from '../data/wali'
  import WaliForm from './WaliForm.svelte'

  interface Props {
    wali: Wali[]
  }

  let { wali }: Props = $props()
  let showForm = $state(false)
  let editingWali: Wali | null = $state(null)
  let error = $state('')
  let sukses = $state('')

  async function loadWali() {
    await invalidateAll()
  }

  function handleEditClick(item: Wali) {
    editingWali = item
    showForm = true
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus wali ini?')) return

    try {
      await deleteWali(id)
      sukses = 'Wali murid berhasil dihapus.'
      await loadWali()
    } catch (err) {
      error = pesanRamah(err, 'Gagal menghapus wali murid.')
    }
  }

  async function handleCloseForm(tersimpan = false) {
    showForm = false
    editingWali = null
    loadWali()
    if (tersimpan) sukses = 'Wali murid berhasil disimpan.'
  }
</script>

<div class="space-y-4">
  {#if error}
    <div class="rounded-lg bg-red-100 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

    {#if sukses}
      <div class="rounded-lg bg-emerald-100 p-4">
        <p class="text-sm font-medium text-emerald-800">✓ {sukses}</p>
      </div>
    {/if}

  <button
    onclick={() => (showForm = true)}
    class="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
  >
    Tambah Wali Murid
  </button>

  {#if showForm}
    <WaliForm editingWali={editingWali} onclose={handleCloseForm} />
  {/if}

  <div class="overflow-x-auto rounded-lg border border-border">
      <table class="w-full divide-y divide-border">
        <thead class="bg-muted/30">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Nama</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each wali as item (item.id)}
            <tr>
              <td class="px-4 py-3 text-sm text-foreground">{item.nama_lengkap}</td>
              <td class="px-4 py-3 text-sm text-foreground">{item.email}</td>
              <td class="px-4 py-3 text-sm space-x-3">
                <button
                  onclick={() => handleEditClick(item)}
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

