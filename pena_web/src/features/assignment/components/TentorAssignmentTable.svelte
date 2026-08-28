<script lang="ts">
  import { listTentorAssignments, deleteTentorAssignment } from '../data/tentor-assignment'
  import TentorAssignmentForm from './TentorAssignmentForm.svelte'

  interface Props {
    tahun_ajaran_id: string
  }

  let { tahun_ajaran_id }: Props = $props()

  let assignments: any[] = []
  let showForm = $state(false)
  let editingAssignment: any = $state(null)
  let loading = $state(true)
  let error = $state('')

  async function loadAssignmentsData() {
    loading = true
    try {
      assignments = await listTentorAssignments(tahun_ajaran_id)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load assignments'
    } finally {
      loading = false
    }
  }

  function reloadAssignments() {
    window.location.reload()
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
      error = err instanceof Error ? err.message : 'Failed to delete assignment'
    }
  }

  function handleCloseForm() {
    showForm = false
    editingAssignment = null
    reloadAssignments()
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
    <div class="overflow-x-auto rounded-lg border border-border">
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
  {/if}
</div>

