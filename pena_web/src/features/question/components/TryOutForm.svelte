<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity'
  import { createTryOut, publishTryOut } from '../data/try-out'

  interface Kelas {
    id: string
    nama: string
  }

  interface Props {
    materiId: string
    kelasOptions: Kelas[]
    tahunAjaranId: string
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

  let { materiId, kelasOptions, tahunAjaranId, initial = null, onSuccess, onCancel }: Props = $props()

  let judul = $state(initial?.judul || '')
  let tipeTest = $state<'biasa' | 'pre_test' | 'post_test'>(initial?.tipe_test || 'biasa')
  let waktuBuka = $state(initial?.waktu_buka || '')
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

      if (!initial) {
        await createTryOut(
          materiId,
          judul,
          tipeTest,
          waktuBuka,
          durasiMenit,
          Array.from(selectedKelas),
          tahunAjaranId
        )
      }

      onSuccess?.()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal menyimpan try out'
    } finally {
      loading = false
    }
  }

  async function handlePublish() {
    if (!initial?.id) return
    loading = true
    error = ''

    try {
      await publishTryOut(initial.id)
      onSuccess?.()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal publish try out'
    } finally {
      loading = false
    }
  }
</script>

<div class="rounded-lg border border-gray-200 bg-white p-6">
  <h3 class="mb-4 text-lg font-semibold text-gray-900">
    {initial ? 'Edit Try Out' : 'Buat Try Out'}
  </h3>

  {#if error}
    <div class="mb-4 rounded-md bg-red-50 p-3">
      <p class="text-sm text-red-800">{error}</p>
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="judul" class="block text-sm font-medium text-gray-700">
        Judul Try Out
      </label>
      <input
        id="judul"
        type="text"
        bind:value={judul}
        required
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        placeholder="Contoh: Try Out Matematika Bab 1"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="tipeTest" class="block text-sm font-medium text-gray-700">
          Tipe Test
        </label>
        <select
          id="tipeTest"
          bind:value={tipeTest}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2 text-sm"
        >
          <option value="biasa">Biasa</option>
          <option value="pre_test">Pre-Test</option>
          <option value="post_test">Post-Test</option>
        </select>
      </div>

      <div>
        <label for="durasiMenit" class="block text-sm font-medium text-gray-700">
          Durasi (menit)
        </label>
        <input
          id="durasiMenit"
          type="number"
          bind:value={durasiMenit}
          min="1"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    </div>

    <div>
      <label for="waktuBuka" class="block text-sm font-medium text-gray-700">
        Waktu Buka
      </label>
      <input
        id="waktuBuka"
        type="datetime-local"
        bind:value={waktuBuka}
        required
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <p class="mt-1 text-xs text-gray-500">
        Soal akan tersembunyi sampai waktu ini
      </p>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Target Kelas
      </label>
      <div class="space-y-2 border border-gray-200 rounded-md p-3 bg-gray-50">
        {#each kelasOptions as kelas (kelas.id)}
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedKelas.has(kelas.id)}
              onchange={() => toggleKelas(kelas.id)}
              class="rounded border-gray-300"
            />
            <span class="text-sm text-gray-700">{kelas.nama}</span>
          </label>
        {/each}
      </div>
      {#if selectedKelas.size === 0}
        <p class="mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
          ⚠️ Pilih minimal 1 kelas
        </p>
      {/if}
    </div>

    <div class="flex gap-3 border-t border-gray-200 pt-4">
      {#if !initial}
        <button
          type="submit"
          disabled={loading || selectedKelas.size === 0}
          class="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? 'Membuat...' : 'Buat Try Out'}
        </button>
      {:else if initial.status === 'draft'}
        <button
          type="button"
          onclick={handlePublish}
          disabled={loading}
          class="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Publishing...' : '✓ Publish Try Out'}
        </button>
      {:else}
        <span class="rounded-md bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          ✓ Published
        </span>
      {/if}

      <button
        type="button"
        onclick={() => onCancel?.()}
        class="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
      >
        Batal
      </button>
    </div>
  </form>
</div>
