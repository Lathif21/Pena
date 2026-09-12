<script lang="ts">
  import { pesanRamah } from '$lib/utils/pesan'
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
      error = pesanRamah(err, 'Gagal menyimpan soal')
    } finally {
      loading = false
    }
  }
</script>

<div class="rounded-xl border border-border bg-card p-5">
  <h3 class="mb-4 font-serif text-lg text-foreground">
    {initial ? 'Edit Soal' : 'Tambah Soal'}
  </h3>

  {#if error}
    <div class="mb-4 rounded-lg bg-red-100 p-3">
      <p class="text-sm text-red-800">{error}</p>
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="pertanyaan" class="block text-sm font-medium text-foreground">
        Pertanyaan
      </label>
      <textarea
        id="pertanyaan"
        bind:value={pertanyaan}
        required
        rows={3}
        class="mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
        placeholder="Masukkan pertanyaan..."
      />
    </div>

    <div class="space-y-3">
      <label class="block text-sm font-medium text-foreground">
        Pilihan Jawaban
      </label>

      {#each pilihan as p, idx (idx)}
        <div class="flex gap-3">
          <div class="flex-1">
            <input
              type="text"
              bind:value={pilihan[idx].teks}
              required
              class="block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
              placeholder="Pilihan {idx + 1}..."
            />
          </div>

          <button
            type="button"
            onclick={() => setBenar(idx)}
            class={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              p.is_benar
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-muted/30 text-foreground hover:bg-muted'
            }`}
          >
            ✓ Benar
          </button>

          {#if pilihan.length > 2}
            <button
              type="button"
              onclick={() => removePilihan(idx)}
              class="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
            >
              Hapus
            </button>
          {/if}
        </div>
      {/each}

      <button
        type="button"
        onclick={addPilihan}
        class="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/30"
      >
        + Tambah Pilihan
      </button>
    </div>

    <div class="flex gap-3 border-t border-border pt-4">
      <button
        type="submit"
        disabled={loading}
        class="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Menyimpan...' : 'Simpan Soal'}
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
