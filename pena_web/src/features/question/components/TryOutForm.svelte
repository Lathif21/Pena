<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity'
  import { createTryOut, updateTryOut } from '../data/try-out'

  interface Kelas {
    id: string
    nama: string
  }

  interface Props {
    materiId: string
    kelasOptions: Kelas[]
    initial?: {
      id: string
      judul: string
      tipe_test: 'biasa' | 'pre_test' | 'post_test'
      waktu_buka: string
      durasi_menit: number
      kelasIds: string[]
      status: 'draft' | 'published'
    } | null
    onSuccess?: () => void
    onCancel?: () => void
  }

  let { materiId, kelasOptions, initial = null, onSuccess, onCancel }: Props = $props()

  /**
   * <input type="datetime-local"> speaks "YYYY-MM-DDTHH:mm" in local time, but the
   * database stores timestamptz. Without these two conversions an existing schedule
   * loads blank, and a saved one is read back as if it were UTC.
   */
  function toLocalInput(iso: string) {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  let judul = $state(initial?.judul || '')
  let tipeTest = $state<'biasa' | 'pre_test' | 'post_test'>(initial?.tipe_test || 'biasa')
  let waktuBuka = $state(toLocalInput(initial?.waktu_buka ?? ''))
  let durasiMenit = $state(initial?.durasi_menit || 60)
  // SvelteSet, not Set: $state does not make built-in collections reactive, so
  // mutating a plain Set never re-renders (the submit button stayed disabled).
  let selectedKelas = new SvelteSet<string>(initial?.kelasIds || [])
  let loading = $state(false)
  let error = $state('')

  function toggleKelas(kelasId: string) {
    if (selectedKelas.has(kelasId)) {
      selectedKelas.delete(kelasId)
    } else {
      selectedKelas.add(kelasId)
    }
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    loading = true
    error = ''

    try {
      if (!judul.trim()) {
        throw new Error('Judul harus diisi')
      }
      if (!waktuBuka) {
        throw new Error('Waktu buka harus diisi')
      }
      if (durasiMenit < 1) {
        throw new Error('Durasi minimal 1 menit')
      }

      if (selectedKelas.size === 0) {
        throw new Error('Pilih minimal 1 kelas')
      }

      const waktuBukaIso = new Date(waktuBuka).toISOString()

      if (initial) {
        await updateTryOut(
          initial.id,
          judul,
          tipeTest,
          waktuBukaIso,
          durasiMenit,
          Array.from(selectedKelas)
        )
      } else {
        await createTryOut(materiId, judul, tipeTest, waktuBukaIso, durasiMenit, Array.from(selectedKelas))
      }

      onSuccess?.()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal menyimpan try out'
    } finally {
      loading = false
    }
  }

</script>

<div class="rounded-xl border border-border bg-card p-5">
  <h3 class="mb-4 font-serif text-lg text-foreground">
    {initial ? 'Edit Try Out' : 'Buat Try Out'}
  </h3>

  {#if error}
    <div class="mb-4 rounded-lg bg-red-100 p-3">
      <p class="text-sm text-red-800">{error}</p>
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="judul" class="block text-sm font-medium text-foreground">
        Judul Try Out
      </label>
      <input
        id="judul"
        type="text"
        bind:value={judul}
        required
        class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
        placeholder="Contoh: Try Out Matematika Bab 1"
      />
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label for="tipeTest" class="block text-sm font-medium text-foreground">
          Tipe Test
        </label>
        <select
          id="tipeTest"
          bind:value={tipeTest}
          class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 pr-8 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
        >
          <option value="biasa">Biasa</option>
          <option value="pre_test">Pre-Test</option>
          <option value="post_test">Post-Test</option>
        </select>
      </div>

      <div>
        <label for="durasiMenit" class="block text-sm font-medium text-foreground">
          Durasi (menit)
        </label>
        <input
          id="durasiMenit"
          type="number"
          bind:value={durasiMenit}
          min="1"
          class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
        />
      </div>
    </div>

    <div>
      <label for="waktuBuka" class="block text-sm font-medium text-foreground">
        Waktu Buka
      </label>
      <input
        id="waktuBuka"
        type="datetime-local"
        bind:value={waktuBuka}
        required
        class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
      />
      <p class="mt-1 text-xs text-muted-foreground">
        Soal akan tersembunyi sampai waktu ini
      </p>
    </div>

    <div>
      <label class="block text-sm font-medium text-foreground mb-2">
        Target Kelas
      </label>
      <div class="space-y-2 border border-border rounded-lg p-3 bg-muted/30">
        {#each kelasOptions as kelas (kelas.id)}
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedKelas.has(kelas.id)}
              onchange={() => toggleKelas(kelas.id)}
              class="rounded border-border"
            />
            <span class="text-sm text-foreground">{kelas.nama}</span>
          </label>
        {/each}
      </div>
      {#if selectedKelas.size === 0}
        <p class="mt-2 text-sm text-amber-800 bg-amber-100 p-2 rounded">
          ⚠️ Pilih minimal 1 kelas
        </p>
      {/if}
    </div>

    <div class="flex gap-3 border-t border-border pt-4">
      <button
        type="submit"
        disabled={loading || selectedKelas.size === 0}
        class="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Menyimpan...' : initial ? 'Simpan Perubahan' : 'Buat Try Out'}
      </button>

      <button
        type="button"
        onclick={() => onCancel?.()}
        class="rounded-lg border border-border bg-card px-4 py-2 text-foreground hover:bg-muted/30"
      >
        Batal
      </button>
    </div>
  </form>
</div>
