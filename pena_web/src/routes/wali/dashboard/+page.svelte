<script lang="ts">
  import { enhance } from '$app/forms'

  let { data } = $props()
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard Wali Murid</h1>
        <p class="mt-1 text-sm text-gray-600">Selamat datang, {data.user.email}</p>
      </div>
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
      <p class="text-gray-600">Dashboard wali murid - coming soon</p>
    </div>
  </div>
</div>
