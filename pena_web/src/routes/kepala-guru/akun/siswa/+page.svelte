<script lang="ts">
  import SiswaTable from '$features/account/components/SiswaTable.svelte'

  let { data } = $props()
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-8">
      <a href="/kepala-guru/dashboard" class="text-sm font-medium text-primary hover:underline">
        ← Kembali ke Dashboard
      </a>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">Akun Siswa</h1>
      <p class="mt-1 text-sm text-gray-500">Kelola akun siswa beserta paket dan NIS</p>
    </div>

    <SiswaTable siswa={data.siswa} />
  </div>
</div>
