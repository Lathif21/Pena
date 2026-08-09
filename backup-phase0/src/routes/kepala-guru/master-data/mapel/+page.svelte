<script lang="ts">
  import MapelTable from '$features/master-data/components/MapelTable.svelte'
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight text-gray-900">Kelola Mata Pelajaran</h1>
      <p class="mt-2 text-gray-600">Tambah, edit, atau hapus mata pelajaran</p>
    </div>

    <div class="rounded-lg bg-white p-6 shadow">
      <MapelTable />
    </div>
  </div>
</div>
