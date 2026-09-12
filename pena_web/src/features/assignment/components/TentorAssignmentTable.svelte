<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { pesanRamah } from '$lib/utils/pesan'
  import { listTentorAssignments, deleteTentorAssignment } from '../data/tentor-assignment'
  import TentorAssignmentForm from './TentorAssignmentForm.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'

  interface Props {
    tahun_ajaran_id: string
  }

  let { tahun_ajaran_id }: Props = $props()

  let assignments: any[] = []
  let showForm = $state(false)
  let editingAssignment: any = $state(null)
  let loading = $state(true)
  let error = $state('')
  let sukses = $state('')

  async function loadAssignmentsData() {
    loading = true
    try {
      assignments = await listTentorAssignments(tahun_ajaran_id)
    } catch (err) {
      error = pesanRamah(err, 'Gagal memuat daftar assignment.')
    } finally {
      loading = false
    }
  }

  async function reloadAssignments() {
    await invalidateAll()
  }

  function handleEditClick(item: any) {
    editingAssignment = item
    showForm = true
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus assignment ini?')) return

    try {
      await deleteTentorAssignment(id)
      reloadAssignments()
    } catch (err) {
      error = pesanRamah(err, 'Gagal menghapus assignment.')
    }
  }

  async function handleCloseForm(tersimpan = false) {
    showForm = false
    editingAssignment = null
    reloadAssignments()
    if (tersimpan) sukses = 'Assignment berhasil disimpan.'
  }

  $effect(() => {
    if (tahun_ajaran_id) {
      loadAssignmentsData()
    }
  })
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
    Tambah Assignment
  </button>

  {#if showForm}
    <TentorAssignmentForm {tahun_ajaran_id} {editingAssignment} onclose={handleCloseForm} />
  {/if}

  {#if loading}
    <p class="text-muted-foreground">Loading...</p>
  {:else}
    <!-- Empat kolom bermakna, salah satunya tombol — di bawah md jadi tumpukan
         card, kalau tidak tombol Hapus terdorong keluar layar. -->
    <div class="space-y-3 md:hidden">
      {#each assignments as item (item.id)}
        <Card>
          <p class="font-medium text-foreground">{item.tentor_nama}</p>
          <p class="mt-1 text-sm text-muted-foreground">{item.kelas_nama} · {item.mapel_nama}</p>
          <div class="mt-3 flex gap-2">
            <Button variant="secondary" class="flex-1" onclick={() => handleEditClick(item)}>
              Edit
            </Button>
            <Button variant="destructive" class="flex-1" onclick={() => handleDelete(item.id)}>
              Hapus
            </Button>
          </div>
        </Card>
      {/each}
    </div>

    <div class="hidden overflow-x-auto rounded-lg border border-border md:block">
      <table class="w-full divide-y divide-border">
        <thead class="bg-muted/30">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Tentor</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Kelas</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Mapel</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each assignments as item (item.id)}
            <tr>
              <td class="px-4 py-3 text-sm text-foreground">{item.tentor_nama}</td>
              <td class="px-4 py-3 text-sm text-foreground">{item.kelas_nama}</td>
              <td class="px-4 py-3 text-sm text-foreground">{item.mapel_nama}</td>
              <td class="space-x-3 px-4 py-3 text-sm">
                <button onclick={() => handleEditClick(item)} class="text-primary hover:underline">
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
  {/if}
</div>

