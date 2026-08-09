<script lang="ts">
  import TahunAjaranTable from '$features/master-data/components/TahunAjaranTable.svelte'

  let { data } = $props()
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-8">
      <a href="/kepala-guru/dashboard" class="text-sm font-medium text-primary hover:underline">
        ← Kembali ke Dashboard
      </a>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">Tahun Ajaran</h1>
      <p class="mt-1 text-sm text-gray-500">Hanya satu tahun ajaran yang aktif dalam satu waktu</p>
    </div>

    <TahunAjaranTable tahunAjaran={data.tahunAjaran} />
  </div>
</div>
