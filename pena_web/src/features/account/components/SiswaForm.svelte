<script lang="ts">
  import { enhance } from '$app/forms'
  import { listKelas, type Kelas } from '$features/master-data/data/kelas'
  import { listMapel, type Mapel } from '$features/master-data/data/mapel'
  import { listTentor, type Tentor } from '../data/tentor'
  import { listTahunAjaran, type TahunAjaran } from '$features/master-data/data/tahun-ajaran'

  interface Props {
    editingSiswa?: {
      id: string
      nama_lengkap: string
      email: string
      nis: string
      paket: 'regular' | 'privat'
      kelas_id?: string
      tentor_mapel?: Array<{ tentor_id: string; mapel_id: string }>
    }
    onclose?: () => void
  }

  let { editingSiswa, onclose }: Props = $props()
  let nama_lengkap = $state(editingSiswa?.nama_lengkap || '')
  let email = $state(editingSiswa?.email || '')
  let password = $state('')
  let nis = $state(editingSiswa?.nis || '')
  let paket = $state<'regular' | 'privat'>(editingSiswa?.paket || 'regular')
  let kelas_id = $state(editingSiswa?.kelas_id || '')
  let selectedTentorMapel = $state<Array<{ tentor_id: string; mapel_id: string }>>(
    editingSiswa?.tentor_mapel ? [...editingSiswa.tentor_mapel] : []
  )

  let kelas_list = $state<Kelas[]>([])
  let mapel_list = $state<Mapel[]>([])
  let tentor_list = $state<Tentor[]>([])
  let tahun_ajaran_list = $state<TahunAjaran[]>([])
  let tahun_ajaran_id = $state('')

  let loading = $state(false)
  let loadingData = $state(true)
  let error = $state('')

  async function loadData() {
    loadingData = true
    try {
      ;[kelas_list, mapel_list, tentor_list, tahun_ajaran_list] = await Promise.all([
        listKelas(),
        listMapel(),
        listTentor(),
        listTahunAjaran()
      ])
      const active = tahun_ajaran_list.find((ta) => ta.is_active)
      if (active) tahun_ajaran_id = active.id
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load data'
    } finally {
      loadingData = false
    }
  }

  function generateNIS() {
    nis = Math.random().toString().slice(2, 10)
  }

  loadData()
</script>

<div class="rounded-md border border-gray-200 bg-white p-6">
  <h3 class="text-lg font-medium text-gray-900 mb-4">
    {editingSiswa ? 'Edit Siswa' : 'Tambah Siswa'}
  </h3>

  {#if error}
    <div class="mb-4 rounded-md bg-red-50 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  {#if loadingData}
    <p class="text-gray-600">Loading...</p>
  {:else}
    <form method="POST" action={editingSiswa ? '?/update' : '?/create'} use:enhance={({ formData }) => {
      if (editingSiswa) {
        formData.set('siswa_id', editingSiswa.id)
      }
      formData.set('tentor_mapel', JSON.stringify(selectedTentorMapel))
      loading = true
      return async ({ result }) => {
        loading = false
        if (result.type === 'success') {
          onclose?.()
        } else if (result.type === 'failure') {
          error = result.data?.error || (editingSiswa ? 'Gagal memperbarui siswa' : 'Gagal membuat siswa')
        }
      }
    }} class="space-y-4">
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

      {#if !editingSiswa}
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

      <div class="flex space-x-2">
        <div class="flex-1">
          <label for="nis" class="block text-sm font-medium text-gray-700">
            NIS
          </label>
          <input
            id="nis"
            name="nis"
            type="text"
            required
            bind:value={nis}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2"
          />
        </div>
        <div class="flex items-end">
          <button
            type="button"
            onclick={generateNIS}
            class="rounded-md bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
          >
            Generate
          </button>
        </div>
      </div>

      <!-- Kelas is editable when creating a regular siswa and whenever editing, so KG
           can move a student between kelas without recreating the account. -->
      {#if editingSiswa || paket === 'regular'}
        <div>
          <label for="kelas" class="block text-sm font-medium text-gray-700">
            Kelas
            {#if editingSiswa && paket === 'privat'}
              <span class="font-normal text-gray-500">(opsional untuk privat)</span>
            {/if}
          </label>
          <select
            id="kelas"
            name="kelas_id"
            required={paket === 'regular'}
            bind:value={kelas_id}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2"
          >
            <option value="">{paket === 'regular' ? 'Pilih Kelas' : 'Tanpa kelas'}</option>
            {#each kelas_list as k (k.id)}
              <option value={k.id}>{k.nama}</option>
            {/each}
          </select>
          {#if editingSiswa}
            <p class="mt-1 text-xs text-gray-500">
              Memindahkan kelas menutup pendaftaran lama, tidak menghapusnya.
            </p>
          {/if}
        </div>
      {/if}

      {#if paket === 'privat'}
        <div class="space-y-2">
          <div class="block text-sm font-medium text-gray-700">
            Tentor & Mata Pelajaran
          </div>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            {#each tentor_list as t (t.id)}
              <div class="flex items-center space-x-4 border-b pb-2">
                <span class="text-sm text-gray-700 flex-1">{t.nama_lengkap}</span>
                <select
                  class="rounded-md border border-gray-300 px-2 py-1 text-sm"
                  value={selectedTentorMapel.find((tm) => tm.tentor_id === t.id)?.mapel_id ?? ''}
                  onchange={(e) => {
                    const mapel_id = (e.target as HTMLSelectElement).value
                    if (mapel_id) {
                      selectedTentorMapel = [
                        ...selectedTentorMapel.filter((tm) => tm.tentor_id !== t.id),
                        { tentor_id: t.id, mapel_id }
                      ]
                    } else {
                      selectedTentorMapel = selectedTentorMapel.filter((tm) => tm.tentor_id !== t.id)
                    }
                  }}
                >
                  <option value="">Pilih Mapel</option>
                  {#each mapel_list as m (m.id)}
                    <option value={m.id}>{m.nama}</option>
                  {/each}
                </select>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if !editingSiswa}
        <div>
          <label for="paket" class="block text-sm font-medium text-gray-700">
            Paket
          </label>
          <select
            id="paket"
            name="paket"
            bind:value={paket}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2"
          >
            <option value="regular">Regular (Kelas)</option>
            <option value="privat">Privat (Tentor)</option>
          </select>
        </div>


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
          {loading ? (editingSiswa ? 'Updating...' : 'Creating...') : 'Simpan'}
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

