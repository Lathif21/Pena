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
    <div class="rounded-md bg-red-50 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  <button
    onclick={() => (showForm = true)}
    class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
  >
    Tambah Assignment
  </button>

  {#if showForm}
    <TentorAssignmentForm {tahun_ajaran_id} {editingAssignment} onclose={handleCloseForm} />
  {/if}

  {#if loading}
    <p class="text-gray-600">Loading...</p>
  {:else}
    <div class="overflow-x-auto rounded-md border border-gray-200">
      <table class="w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Tentor</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Kelas</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Mapel</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-900">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each assignments as item (item.id)}
            <tr>
              <td class="px-6 py-4 text-sm text-gray-900">{item.tentor_nama}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{item.kelas_nama}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{item.mapel_nama}</td>
              <td class="px-6 py-4 text-sm space-x-3">
                <button
                  onclick={() => handleEditClick(item)}
                  class="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </button>
                <button
                  onclick={() => handleDelete(item.id)}
                  class="text-red-600 hover:text-red-900"
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

