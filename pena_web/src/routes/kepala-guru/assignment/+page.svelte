<script lang="ts">
  import TentorAssignmentTable from '$features/assignment/components/TentorAssignmentTable.svelte'
  import { UsersRound } from 'lucide-svelte'

  let { data } = $props()

  let selectedTahunAjaranId = $state(data.activeTahunAjaranId)
</script>

<div class="mb-6">
  <h1 class="font-serif text-2xl text-foreground">Assignment Tentor</h1>
  <p class="mt-1 text-sm text-muted-foreground">Tugaskan tentor ke kelas dan mata pelajaran</p>
</div>

<div class="mb-6 max-w-sm">
  <label for="tahunAjaran" class="block text-sm font-medium text-foreground">Tahun Ajaran</label>
  <select
    id="tahunAjaran"
    bind:value={selectedTahunAjaranId}
    class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-8 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
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
  <div class="rounded-xl border border-dashed border-border p-8 text-center">
    <UsersRound class="mx-auto h-8 w-8 text-muted-foreground" />
    <p class="mt-2 text-sm text-muted-foreground">
      Belum ada tahun ajaran. Buat tahun ajaran terlebih dahulu di Master Data.
    </p>
  </div>
{/if}
