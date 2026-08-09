<script lang="ts">
  import { goto } from '$app/navigation'
  import { supabase } from '$lib/supabase/client'

  let email = ''
  let password = ''
  let error = ''
  let loading = false

  async function handleLogin() {
    loading = true
    error = ''

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError
      if (!data.user) throw new Error('No user returned')

      // Fetch user profile to determine role and redirect
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .is('deleted_at', null)
        .single()

      if (profileError) throw profileError

      // Redirect based on role
      if (profile.role === 'kepala_guru') {
        goto('/kepala-guru/dashboard')
      } else if (profile.role === 'tentor') {
        goto('/tentor/dashboard')
      } else if (profile.role === 'siswa') {
        goto('/siswa/mapel')
      } else if (profile.role === 'wali_murid') {
        goto('/wali/anak')
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Login failed'
    } finally {
      loading = false
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
  <div class="w-full max-w-md space-y-8">
    <div>
      <h2 class="text-center text-3xl font-bold tracking-tight text-gray-900">
        Pena E-Learning
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Platform pembelajaran untuk Bimbingan Belajar
      </p>
    </div>

    <form class="space-y-6" on:submit|preventDefault={handleLogin}>
      {#if error}
        <div class="rounded-md bg-red-50 p-4">
          <p class="text-sm font-medium text-red-800">{error}</p>
        </div>
      {/if}

      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autocomplete="email"
          required
          bind:value={email}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          autocomplete="current-password"
          required
          bind:value={password}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full rounded-md bg-blue-600 py-2 px-4 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  </div>
</div>
