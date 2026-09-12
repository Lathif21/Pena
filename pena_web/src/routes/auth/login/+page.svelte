<script lang="ts">
  import { enhance } from '$app/forms'
  import Button from '$lib/components/Button.svelte'

  let loading = $state(false)
  let error = $state('')

  const gayaField =
    'block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none'
</script>

<div class="flex min-h-screen items-center justify-center bg-background px-4 py-8">
  <div class="w-full max-w-md">
    <div class="rounded-xl border border-border bg-card p-8">
      <div class="mb-8">
        <h1 class="font-serif text-2xl text-foreground">Pena</h1>
        <p class="mt-1 text-sm text-muted-foreground">Platform e-learning bimbingan belajar</p>
      </div>

      {#if error}
        <div class="mb-6 rounded-lg bg-red-100 p-4">
          <p class="text-sm text-red-800">{error}</p>
          {#if error.includes('Email') || error.includes('email')}
            <p class="mt-2 text-xs text-red-800">
              Pastikan akun siswa sudah dibuat di halaman "Kelola Akun &gt; Siswa"
            </p>
          {/if}
        </div>
      {/if}

      <form
        method="POST"
        use:enhance={({ formData }) => {
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
        }}
        class="space-y-4"
      >
        <div>
          <label for="email" class="mb-2 block text-sm font-medium text-foreground">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            required
            class={gayaField}
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label for="password" class="mb-2 block text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            required
            class={gayaField}
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" disabled={loading} class="mt-6 w-full">
          {loading ? 'Masuk...' : 'Masuk'}
        </Button>
      </form>

      <div class="mt-6 border-t border-border pt-6">
        <p class="text-center text-xs text-muted-foreground">
          This solution was efficiently engineered by befisien
        </p>
      </div>
    </div>
  </div>
</div>
