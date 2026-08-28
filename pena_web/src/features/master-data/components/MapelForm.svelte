<script lang="ts">
  import { createMapel, updateMapel, listKelasForMapel, type Mapel } from '../data/mapel'
  import { listKelas, type Kelas } from '../data/kelas'

  interface Props {
    initial?: Mapel | null
    onclose?: () => void
  }

  let { initial = null, onclose }: Props = $props()

  let nama = $state(initial?.nama || '')
  let kelasOptions = $state<Kelas[]>([])
  let selectedKelas = $state<string[]>(initial?.kelas_ids ?? [])
  let loadingKelas = $state(true)
  let loading = $state(false)
  let error = $state('')

  function toggleKelas(id: string) {
    selectedKelas = selectedKelas.includes(id)
      ? selectedKelas.filter(k => k !== id)
      : [...selectedKelas, id]
  }

  async function loadKelas() {
    loadingKelas = true
    try {
      kelasOptions = await listKelas()
      // Kalau sedang edit dan daftar kelas belum dikirim lewat props, ambil dari DB
      if (initial?.id && !initial.kelas_ids) {
        selectedKelas = await listKelasForMapel(initial.id)
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal memuat kelas'
    } finally {
      loadingKelas = false
    }
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    loading = true
    error = ''

    try {
      if (initial?.id) {
        await updateMapel(initial.id, nama, selectedKelas)
      } else {
        await createMapel(nama, selectedKelas)
      }
      onclose?.()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save'
    } finally {
      loading = false
    }
  }

  $effect(() => {
    loadKelas()
  })
</script>

<div class="rounded-xl border border-border bg-card p-5">
  <h3 class="mb-4 font-serif text-lg text-foreground">
    {initial ? 'Edit Mapel' : 'Tambah Mapel'}
  </h3>

  {#if error}
    <div class="mb-4 rounded-lg bg-red-100 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="nama" class="block text-sm font-medium text-foreground">
        Nama Mapel
      </label>
      <input
        id="nama"
        type="text"
        required
        bind:value={nama}
        class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
      />
    </div>

    <div>
      <span class="block text-sm font-medium text-foreground">Kelas yang memakai mapel ini</span>
      <p class="mt-1 text-xs text-muted-foreground">
        Satu mapel bisa dipakai beberapa kelas. Siswa hanya melihat mapel dari kelasnya.
      </p>

      {#if loadingKelas}
        <p class="mt-2 text-sm text-muted-foreground">Memuat kelas...</p>
      {:else if kelasOptions.length === 0}
        <p class="mt-2 text-sm text-amber-800">
          Belum ada kelas. Buat kelas dulu di Master Data → Kelas.
        </p>
      {:else}
        <div class="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
          {#each kelasOptions as kelas (kelas.id)}
            <label class="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={selectedKelas.includes(kelas.id)}
                onchange={() => toggleKelas(kelas.id)}
                class="rounded border-border"
              />
              <span class="text-sm text-foreground">{kelas.nama}</span>
            </label>
          {/each}
        </div>
      {/if}
    </div>

    <div class="flex space-x-3">
      <button
        type="submit"
        disabled={loading}
        class="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Simpan'}
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
