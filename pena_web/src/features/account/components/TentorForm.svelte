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

<div class="rounded-md border border-gray-200 bg-white p-6">
  <h3 class="text-lg font-medium text-gray-900 mb-4">
    {editingTentor ? 'Edit Tentor' : 'Tambah Tentor'}
  </h3>

  {#if error}
    <div class="mb-4 rounded-md bg-red-50 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  {#if loadingTA}
    <p class="text-gray-600">Loading...</p>
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
        <label for="nama" class="block text-sm font-medium text-gray-700">
          Nama Lengkap
        </label>
        <input
          id="nama"
          name="nama_lengkap"
          type="text"
          required
          bind:value={nama_lengkap}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2"
        />
      </div>

      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="text"
          required
          pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+"
          bind:value={email}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2"
        />
      </div>

      {#if !editingTentor}
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            bind:value={password}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2"
          />
        </div>
      {/if}

      {#if !editingTentor}
        <div>
          <label for="tahun" class="block text-sm font-medium text-gray-700">
            Tahun Ajaran
          </label>
          <select
            id="tahun"
            name="tahun_ajaran_id"
            required
            bind:value={tahun_ajaran_id}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2"
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
          class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (editingTentor ? 'Updating...' : 'Creating...') : 'Simpan'}
        </button>
        <button
          type="button"
          onclick={() => onclose?.()}
          class="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </form>
  {/if}
</div>

