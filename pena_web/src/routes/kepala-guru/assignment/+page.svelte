<script lang="ts">
  import TentorAssignmentTable from '$features/assignment/components/TentorAssignmentTable.svelte'

  let { data } = $props()

  let selectedTahunAjaranId = $state(data.activeTahunAjaranId)
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-8">
      <a href="/kepala-guru/dashboard" class="text-sm font-medium text-primary hover:underline">
        ← Kembali ke Dashboard
      </a>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">Assignment Tentor</h1>
      <p class="mt-1 text-sm text-gray-500">Tugaskan tentor ke kelas dan mata pelajaran</p>
    </div>

    <div class="mb-6 max-w-sm">
      <label for="tahunAjaran" class="block text-sm font-medium text-gray-700">Tahun Ajaran</label>
      <select
        id="tahunAjaran"
        bind:value={selectedTahunAjaranId}
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2"
      >
        {#each data.tahunAjaran as ta (ta.id)}
          <option value={ta.id}>{ta.nama}{ta.is_active ? ' (aktif)' : ''}</option>
        {/each}
      </select>
    </div>

    {#if selectedTahunAjaranId}
      {#key selectedTahunAjaranId}
        <TentorAssignmentTable tahun_ajaran_id={selectedTahunAjaranId} />
      {/key}
    {:else}
      <div class="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
        <p class="text-sm text-gray-500">
          Belum ada tahun ajaran. Buat tahun ajaran terlebih dahulu di Master Data.
        </p>
      </div>
    {/if}
  </div>
</div>
