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

<div class="rounded-xl border border-border bg-card p-5">
  <h3 class="mb-4 font-serif text-lg text-foreground">
    {editingSiswa ? 'Edit Siswa' : 'Tambah Siswa'}
  </h3>

  {#if error}
    <div class="mb-4 rounded-lg bg-red-100 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  {#if loadingData}
    <p class="text-muted-foreground">Loading...</p>
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

      {#if !editingSiswa}
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

      <div class="flex space-x-2">
        <div class="flex-1">
          <label for="nis" class="block text-sm font-medium text-foreground">
            NIS
          </label>
          <input
            id="nis"
            name="nis"
            type="text"
            required
            bind:value={nis}
            class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-8 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
          />
        </div>
        <div class="flex items-end">
          <button
            type="button"
            onclick={generateNIS}
            class="rounded-lg bg-muted px-3 py-2 text-sm hover:bg-muted/40"
          >
            Generate
          </button>
        </div>
      </div>

      <!-- Kelas is editable when creating a regular siswa and whenever editing, so KG
           can move a student between kelas without recreating the account. -->
      {#if editingSiswa || paket === 'regular'}
        <div>
          <label for="kelas" class="block text-sm font-medium text-foreground">
            Kelas
            {#if editingSiswa && paket === 'privat'}
              <span class="font-normal text-muted-foreground">(opsional untuk privat)</span>
            {/if}
          </label>
          <select
            id="kelas"
            name="kelas_id"
            required={paket === 'regular'}
            bind:value={kelas_id}
            class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-8 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
          >
            <option value="">{paket === 'regular' ? 'Pilih Kelas' : 'Tanpa kelas'}</option>
            {#each kelas_list as k (k.id)}
              <option value={k.id}>{k.nama}</option>
            {/each}
          </select>
          {#if editingSiswa}
            <p class="mt-1 text-xs text-muted-foreground">
              Memindahkan kelas menutup pendaftaran lama, tidak menghapusnya.
            </p>
          {/if}
        </div>
      {/if}

      {#if paket === 'privat'}
        <div class="space-y-2">
          <div class="block text-sm font-medium text-foreground">
            Tentor & Mata Pelajaran
          </div>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            {#each tentor_list as t (t.id)}
              <div class="flex items-center space-x-4 border-b pb-2">
                <span class="text-sm text-foreground flex-1">{t.nama_lengkap}</span>
                <select
                  class="rounded-lg border border-border px-2 py-1 text-sm"
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
          <label for="paket" class="block text-sm font-medium text-foreground">
            Paket
          </label>
          <select
            id="paket"
            name="paket"
            bind:value={paket}
            class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-8 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
          >
            <option value="regular">Regular (Kelas)</option>
            <option value="privat">Privat (Tentor)</option>
          </select>
        </div>


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
          {loading ? (editingSiswa ? 'Updating...' : 'Creating...') : 'Simpan'}
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

