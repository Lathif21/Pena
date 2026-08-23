<script lang="ts">
  import { enhance } from '$app/forms'

  let loading = $state(false)
  let error = $state('')
</script>

<div class="min-h-screen bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center px-4">
  <div class="w-full max-w-md">
    <div class="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Pena</h1>
        <p class="text-sm text-gray-500 mt-1">Platform e-learning bimbingan belajar</p>
      </div>

      {#if error}
        <div class="mb-6 rounded-lg bg-red-50 p-4">
          <p class="text-sm text-red-700">{error}</p>
          {#if error.includes('Email') || error.includes('email')}
            <p class="text-xs text-red-600 mt-2">💡 Pastikan akun siswa sudah dibuat di halaman "Kelola Akun > Siswa"</p>
          {/if}
        </div>
      {/if}

      <form method="POST" use:enhance={({ formData }) => {
        loading = true
        error = ''
        return async ({ result }) => {
          loading = false
          if (result.type === 'failure') {
            console.log('Login failure result:', result)
            error = result.data?.error || JSON.stringify(result.data) || 'Login gagal'
          } else if (result.type === 'redirect') {
            // Let SvelteKit handle the redirect naturally
            window.location.href = result.location
          }
        }
      }} class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            class="block w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            required
            class="block w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 mt-6"
        >
          {loading ? 'Masuk...' : 'Masuk'}
        </button>
      </form>

      <div class="mt-6 pt-6 border-t border-gray-200">
        <p class="text-xs text-gray-500 text-center">
          This solution was efficiently engineered by befisien
        </p>
      </div>
    </div>
  </div>
</div>
