<script lang="ts">
  import { enhance } from '$app/forms'
  import type { SubmitFunction } from '@sveltejs/kit'
  import { Eye, EyeOff } from 'lucide-svelte'
  import Button from '$lib/components/Button.svelte'

  let { form } = $props()
  let loading = $state(false)
  let gagalServer = $state('')
  let passwordTerlihat = $state(false)

  const gayaField =
    'block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none'

  // Server crash atau koneksi putus tidak menghasilkan `form`, jadi pesannya
  // dipasang di sini — tanpa ini tombol berhenti loading tanpa penjelasan.
  const kirimForm: SubmitFunction = () => {
    loading = true
    gagalServer = ''
    return async ({ result, update }) => {
      loading = false
      if (result.type === 'error') {
        gagalServer = 'Server sedang bermasalah atau koneksi terputus. Coba lagi sebentar.'
      } else {
        await update()
      }
    }
  }

  let error = $derived(gagalServer || form?.error || '')
</script>

<svelte:head>
  <title>Lupa Password · Pena</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-background px-4 py-8">
  <div class="w-full max-w-md rounded-xl border border-border bg-card p-8">
    <h1 class="font-serif text-2xl text-foreground">Lupa Password</h1>

    {#if !form?.terkirim}
      <p class="mt-1 mb-6 text-sm text-muted-foreground">
        Masukkan email akun Anda. Kami kirim kode 6 angka untuk membuat password baru.
      </p>
    {:else}
      <p class="mt-1 mb-6 text-sm text-muted-foreground">
        Kode sudah dikirim ke <span class="font-medium text-foreground">{form.email}</span>.
        Periksa juga folder Spam. Kode berlaku 1 jam.
      </p>
    {/if}

    {#if form?.ulang && !error}
      <div class="mb-6 rounded-lg bg-emerald-100 p-4" role="status">
        <p class="text-sm text-emerald-800">✓ Kode baru sudah dikirim. Kode sebelumnya tidak berlaku lagi.</p>
      </div>
    {:else if error}
      <div class="mb-6 rounded-lg bg-red-100 p-4" role="alert">
        <p class="text-sm text-red-800">{error}</p>
      </div>
    {/if}

    {#if !form?.terkirim}
      <form method="POST" action="?/kirim" use:enhance={kirimForm} class="space-y-4">
        <div>
          <label for="email" class="mb-2 block text-sm font-medium text-foreground">Email</label>
          <input id="email" type="email" name="email" required autocomplete="email"
            value={form?.email ?? ''} class={gayaField} placeholder="email@example.com" />
        </div>
        <Button type="submit" disabled={loading} class="w-full">
          {loading ? 'Mengirim...' : 'Kirim Kode'}
        </Button>
      </form>
    {:else}
      <form method="POST" action="?/ganti" use:enhance={kirimForm} class="space-y-4">
        <input type="hidden" name="email" value={form.email} />
        <div>
          <label for="kode" class="mb-2 block text-sm font-medium text-foreground">Kode dari email</label>
          <input id="kode" name="kode" required inputmode="numeric" autocomplete="one-time-code"
            pattern="[0-9]{6}" maxlength="6" title="6 angka dari email"
            class="{gayaField} font-mono tracking-[0.3em]" placeholder="000000" />
        </div>
        <div>
          <label for="password" class="mb-2 block text-sm font-medium text-foreground">Password baru</label>
          <div class="relative">
            <input id="password" name="password" required minlength="8" autocomplete="new-password"
              type={passwordTerlihat ? 'text' : 'password'} class="{gayaField} pr-12" />
            <button
              type="button"
              onclick={() => (passwordTerlihat = !passwordTerlihat)}
              aria-label={passwordTerlihat ? 'Sembunyikan password' : 'Tampilkan password'}
              aria-pressed={passwordTerlihat}
              aria-controls="password"
              class="absolute inset-y-0 right-0 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/40 hover:text-foreground focus:ring-1 focus:ring-ring focus:outline-none"
            >
              {#if passwordTerlihat}<EyeOff class="h-4 w-4" />{:else}<Eye class="h-4 w-4" />{/if}
            </button>
          </div>
          <p class="mt-1 text-xs text-muted-foreground">Minimal 8 karakter.</p>
        </div>
        <Button type="submit" disabled={loading} class="w-full">
          {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
        </Button>
      </form>

      <form method="POST" action="?/kirim" use:enhance={kirimForm} class="mt-4 text-center">
        <input type="hidden" name="email" value={form.email} />
        <input type="hidden" name="ulang" value="1" />
        <button type="submit" disabled={loading} class="min-h-11 text-sm text-primary hover:underline disabled:opacity-50">
          Tidak menerima kode? Kirim ulang
        </button>
      </form>
    {/if}

    <div class="mt-6 border-t border-border pt-6 text-center text-sm">
      <a href="/auth/login" class="text-primary hover:underline">Kembali ke halaman masuk</a>
      <p class="mt-2 text-xs text-muted-foreground">
        Tidak punya akses ke email Anda? Minta kepala guru mengganti password Anda.
      </p>
    </div>
  </div>
</div>
