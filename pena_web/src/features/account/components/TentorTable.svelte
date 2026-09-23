<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { pesanRamah } from '$lib/utils/pesan'
  import { deleteTentor, type Tentor } from '../data/tentor'
  import TentorForm from './TentorForm.svelte'
  import GantiPasswordForm from './GantiPasswordForm.svelte'

  interface Props {
    tentor: Tentor[]
  }

  let { tentor }: Props = $props()
  let showForm = $state(false)
  let editingTentor: Tentor | null = $state(null)
  let error = $state('')
  let sukses = $state('')
  let gantiPasswordAkun: Tentor | null = $state(null)

  function handleGantiPasswordClose(tersimpan = false) {
    if (tersimpan) sukses = `Password ${gantiPasswordAkun?.nama_lengkap} berhasil diganti.`
    gantiPasswordAkun = null
  }

  async function loadTentor() {
    await invalidateAll()
  }

  function handleEditClick(item: Tentor) {
    editingTentor = item
    showForm = true
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus tentor ini?')) return

    try {
      await deleteTentor(id)
      sukses = 'Tentor berhasil dihapus.'
      await loadTentor()
    } catch (err) {
      error = pesanRamah(err, 'Gagal menghapus tentor.')
    }
  }

  async function handleCloseForm(tersimpan = false) {
    showForm = false
    editingTentor = null
    loadTentor()
    if (tersimpan) sukses = 'Tentor berhasil disimpan.'
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
    Tambah Tentor
  </button>

  {#if showForm}
    <TentorForm editingTentor={editingTentor} onclose={handleCloseForm} />
  {/if}

  {#if gantiPasswordAkun}
    {#key gantiPasswordAkun.id}
      <GantiPasswordForm akun={gantiPasswordAkun} onclose={handleGantiPasswordClose} />
    {/key}
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
          {#each tentor as item (item.id)}
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
                  onclick={() => (gantiPasswordAkun = item)}
                  class="text-primary hover:underline"
                >
                  Ganti Password
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

