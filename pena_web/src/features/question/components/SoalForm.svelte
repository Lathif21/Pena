<script lang="ts">
  import { createSoal, updateSoal } from '../data/soal'

  interface Props {
    parentId: string
    parentType: 'sub_materi' | 'materi'
    initial?: { id: string; pertanyaan: string; pilihan: Array<{ teks: string; is_benar: boolean }> } | null
    onSuccess?: () => void
    onCancel?: () => void
  }

  let { parentId, parentType, initial = null, onSuccess, onCancel }: Props = $props()

  let pertanyaan = $state(initial?.pertanyaan || '')
  let pilihan = $state<Array<{ teks: string; is_benar: boolean }>>(
    initial?.pilihan || [
      { teks: '', is_benar: false },
      { teks: '', is_benar: false }
    ]
  )
  let loading = $state(false)
  let error = $state('')

  function addPilihan() {
    pilihan = [...pilihan, { teks: '', is_benar: false }]
  }

  function removePilihan(index: number) {
    if (pilihan.length > 2) {
      pilihan = pilihan.filter((_, i) => i !== index)
    }
  }

  function setBenar(index: number) {
    pilihan = pilihan.map((p, i) => ({
      ...p,
      is_benar: i === index
    }))
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    loading = true
    error = ''

    try {
      if (initial?.id) {
        await updateSoal(initial.id, pertanyaan, pilihan)
      } else {
        await createSoal(parentId, parentType, pertanyaan, pilihan)
      }
      onSuccess?.()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal menyimpan soal'
    } finally {
      loading = false
    }
  }
</script>

<div class="rounded-lg border border-gray-200 bg-white p-6">
  <h3 class="mb-4 text-lg font-semibold text-gray-900">
    {initial ? 'Edit Soal' : 'Tambah Soal'}
  </h3>

  {#if error}
    <div class="mb-4 rounded-md bg-red-50 p-3">
      <p class="text-sm text-red-800">{error}</p>
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="pertanyaan" class="block text-sm font-medium text-gray-700">
        Pertanyaan
      </label>
      <textarea
        id="pertanyaan"
        bind:value={pertanyaan}
        required
        rows={3}
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        placeholder="Masukkan pertanyaan..."
      />
    </div>

    <div class="space-y-3">
      <label class="block text-sm font-medium text-gray-700">
        Pilihan Jawaban
      </label>

      {#each pilihan as p, idx (idx)}
        <div class="flex gap-3">
          <div class="flex-1">
            <input
              type="text"
              bind:value={pilihan[idx].teks}
              required
              class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Pilihan {idx + 1}..."
            />
          </div>

          <button
            type="button"
            onclick={() => setBenar(idx)}
            class={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              p.is_benar
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            ✓ Benar
          </button>

          {#if pilihan.length > 2}
            <button
              type="button"
              onclick={() => removePilihan(idx)}
              class="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Hapus
            </button>
          {/if}
        </div>
      {/each}

      <button
        type="button"
        onclick={addPilihan}
        class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        + Tambah Pilihan
      </button>
    </div>

    <div class="flex gap-3 border-t border-gray-200 pt-4">
      <button
        type="submit"
        disabled={loading}
        class="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {loading ? 'Menyimpan...' : 'Simpan Soal'}
      </button>
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
