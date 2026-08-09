<script lang="ts">
  import { listTahunAjaran, type TahunAjaran } from '$features/master-data/data/tahun-ajaran'
  import TentorAssignmentTable from '$features/assignment/components/TentorAssignmentTable.svelte'

  let tahun_ajaran_list: TahunAjaran[] = []
  let selectedTahunAjaran = ''
  let loading = true
  let error = ''

  async function loadTahunAjaran() {
    loading = true
    try {
      tahun_ajaran_list = await listTahunAjaran()
      const active = tahun_ajaran_list.find((ta) => ta.is_active)
      if (active) selectedTahunAjaran = active.id
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load tahun ajaran'
    } finally {
      loading = false
    }
  }

  loadTahunAjaran()
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight text-gray-900">Assignment Tentor</h1>
      <p class="mt-2 text-gray-600">Kelola assignment tentor ke kelas dan mata pelajaran</p>
    </div>

    {#if error}
      <div class="mb-6 rounded-md bg-red-50 p-4">
        <p class="text-sm font-medium text-red-800">{error}</p>
      </div>
    {/if}

    {#if loading}
      <p class="text-gray-600">Loading...</p>
    {:else}
      <div class="mb-6 rounded-lg bg-white p-6 shadow">
        <label for="tahun" class="block text-sm font-medium text-gray-700 mb-2">
          Pilih Tahun Ajaran
        </label>
        <select
          id="tahun"
          bind:value={selectedTahunAjaran}
          class="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">Pilih Tahun Ajaran</option>
          {#each tahun_ajaran_list as ta (ta.id)}
            <option value={ta.id}>
              {ta.nama} {ta.is_active ? '(Aktif)' : ''}
            </option>
          {/each}
        </select>
      </div>

      {#if selectedTahunAjaran}
        <div class="rounded-lg bg-white p-6 shadow">
          <TentorAssignmentTable tahun_ajaran_id={selectedTahunAjaran} />
        </div>
      {/if}
    {/if}
  </div>
</div>
