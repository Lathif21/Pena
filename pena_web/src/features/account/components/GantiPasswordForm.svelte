<script lang="ts">
  import { enhance } from '$app/forms'
  import { Eye, EyeOff } from 'lucide-svelte'

  interface Props {
    akun: { id: string; nama_lengkap: string }
    onclose?: (tersimpan?: boolean) => void
  }

  let { akun, onclose }: Props = $props()
  let password = $state('')
  let passwordTerlihat = $state(false)
  let loading = $state(false)
  let error = $state('')
</script>

<div class="rounded-xl border border-border bg-card p-5">
  <h3 class="font-serif text-lg text-foreground">Ganti Password</h3>
  <p class="mt-1 mb-4 text-sm text-muted-foreground">
    {akun.nama_lengkap} akan keluar dari semua perangkat dan harus login dengan password baru.
  </p>

  {#if error}
    <div class="mb-4 rounded-lg bg-red-100 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  <form
    method="POST"
    action="?/resetPassword"
    use:enhance={() => {
      loading = true
      return async ({ result }) => {
        loading = false
        if (result.type === 'success') {
          onclose?.(true)
        } else if (result.type === 'failure') {
          error = (result.data?.error as string) || 'Gagal mengganti password'
        } else if (result.type === 'error') {
          // Server crash atau koneksi putus — tanpa ini form diam saja.
          error = 'Gagal mengganti password. Server sedang bermasalah atau koneksi terputus — coba lagi sebentar.'
        }
      }
    }}
    class="space-y-4"
  >
    <input type="hidden" name="profile_id" value={akun.id} />
    <div>
      <label for="password-baru" class="block text-sm font-medium text-foreground">
        Password Baru
      </label>
      <div class="relative mt-1">
        <input
          id="password-baru"
          name="password"
          type={passwordTerlihat ? 'text' : 'password'}
          required
          minlength="8"
          autocomplete="new-password"
          bind:value={password}
          class="block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-12 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
        />
        <button
          type="button"
          onclick={() => (passwordTerlihat = !passwordTerlihat)}
          aria-label={passwordTerlihat ? 'Sembunyikan password' : 'Tampilkan password'}
          aria-pressed={passwordTerlihat}
          aria-controls="password-baru"
          class="absolute inset-y-0 right-0 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/40 hover:text-foreground focus:ring-1 focus:ring-ring focus:outline-none"
        >
          {#if passwordTerlihat}
            <EyeOff class="h-4 w-4" />
          {:else}
            <Eye class="h-4 w-4" />
          {/if}
        </button>
      </div>
      <p class="mt-1 text-xs text-muted-foreground">Minimal 8 karakter.</p>
    </div>

    <div class="flex space-x-3">
      <button
        type="submit"
        disabled={loading}
        class="rounded-lg bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Menyimpan...' : 'Simpan'}
      </button>
      <button
        type="button"
        onclick={() => onclose?.()}
        class="rounded-lg border border-border px-4 py-2 text-foreground hover:bg-muted/30"
      >
        Batal
      </button>
    </div>
  </form>
</div>
