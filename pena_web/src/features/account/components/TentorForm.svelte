<script lang="ts">
  import { enhance } from '$app/forms'
  import { listTahunAjaran, type TahunAjaran } from '$features/master-data/data/tahun-ajaran'

  interface Props {
    editingTentor?: { id: string; nama_lengkap: string; email: string }
    onclose?: () => void
  }

  let { editingTentor, onclose }: Props = $props()
  let nama_lengkap = $state(editingTentor?.nama_lengkap || '')
  let email = $state(editingTentor?.email || '')
  let password = $state('')
  let tahun_ajaran_id = $state('')
  let tahun_ajaran_list: TahunAjaran[] = []
  let loading = $state(false)
  let loadingTA = $state(true)
  let error = $state('')

  async function loadTahunAjaran() {
    loadingTA = true
    try {
      tahun_ajaran_list = await listTahunAjaran()
      const active = tahun_ajaran_list.find((ta) => ta.is_active)
      if (active) tahun_ajaran_id = active.id
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load tahun ajaran'
    } finally {
      loadingTA = false
    }
  }

  loadTahunAjaran()
</script>

<div class="rounded-xl border border-border bg-card p-5">
  <h3 class="mb-4 font-serif text-lg text-foreground">
    {editingTentor ? 'Edit Tentor' : 'Tambah Tentor'}
  </h3>

  {#if error}
    <div class="mb-4 rounded-lg bg-red-100 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  {#if loadingTA}
    <p class="text-muted-foreground">Loading...</p>
  {:else}
    <form method="POST" action={editingTentor ? '?/update' : '?/create'} use:enhance={() => {
      loading = true
      return async ({ result }) => {
        loading = false
        if (result.type === 'success') {
          onclose?.()
        } else if (result.type === 'failure') {
          error = result.data?.error || (editingTentor ? 'Gagal memperbarui tentor' : 'Gagal membuat tentor')
        }
      }
    }} class="space-y-4">
      {#if editingTentor}
        <input type="hidden" name="tentor_id" value={editingTentor.id} />
      {/if}
      <div>
        <label for="nama" class="block text-sm font-medium text-foreground">
          Nama Lengkap
        </label>
        <input
          id="nama"
          name="nama_lengkap"
          type="text"
          required
          bind:value={nama_lengkap}
          class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-8 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
        />
      </div>

      <div>
        <label for="email" class="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="text"
          required
          pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+"
          bind:value={email}
          class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-8 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
        />
      </div>

      {#if !editingTentor}
        <div>
          <label for="password" class="block text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            bind:value={password}
            class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-8 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
          />
        </div>
      {/if}

      {#if !editingTentor}
        <div>
          <label for="tahun" class="block text-sm font-medium text-foreground">
            Tahun Ajaran
          </label>
          <select
            id="tahun"
            name="tahun_ajaran_id"
            required
            bind:value={tahun_ajaran_id}
            class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-8 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
          >
            <option value="">Pilih Tahun Ajaran</option>
            {#each tahun_ajaran_list as ta (ta.id)}
              <option value={ta.id}>
                {ta.nama} {ta.is_active ? '(Aktif)' : ''}
              </option>
            {/each}
          </select>
        </div>
      {/if}

      <div class="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          class="rounded-lg bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (editingTentor ? 'Updating...' : 'Creating...') : 'Simpan'}
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
  {/if}
</div>

