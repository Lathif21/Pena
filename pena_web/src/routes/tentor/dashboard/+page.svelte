<script lang="ts">
  import { goto } from '$app/navigation'
  import { enhance } from '$app/forms'
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-8 flex items-center justify-between">
      <h1 class="text-3xl font-bold text-gray-900">Dashboard Tentor</h1>
      <form method="POST" action="?/logout" use:enhance>
        <button
          type="submit"
          class="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Logout
        </button>
      </form>
    </div>

    <div class="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Pembelajaran</h2>
      <div class="space-y-2">
        <button
          onclick={() => goto('/tentor/modul')}
          class="block w-full rounded-md bg-indigo-50 px-4 py-3 text-left text-indigo-700 hover:bg-indigo-100"
        >
          📖 Modul Pembelajaran
        </button>
        <button
          onclick={() => goto('/tentor/nilai')}
          class="block w-full rounded-md bg-indigo-50 px-4 py-3 text-left text-indigo-700 hover:bg-indigo-100"
        >
          📝 Nilai Siswa
        </button>
      </div>
    </div>

  </div>
</div>
