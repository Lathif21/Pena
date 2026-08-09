<script lang="ts">
  import { goto } from '$app/navigation'
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
    <div class="rounded-lg bg-white p-8 shadow-lg">
      <h1 class="mb-2 text-4xl font-bold text-gray-900">
        Dashboard Tentor
      </h1>
      <p class="mb-8 text-gray-600">
        Fitur dashboard tentor akan tersedia di fase selanjutnya
      </p>

      <button
        on:click={() => goto('/kepala-guru/dashboard')}
        class="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
      >
        Kembali ke Dashboard Kepala Guru
      </button>
    </div>
  </div>
</div>
