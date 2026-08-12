<script lang="ts">
  import { softDeleteSoal } from '../data/soal'

  interface Soal {
    id: string
    pertanyaan: string
    nomor_urut: number
    pilihan: Array<{ id: string; teks: string; is_benar: boolean }>
  }

  interface Props {
    soalList: Soal[]
    selectedSoalId?: string
    onSelect?: (soalId: string) => void
    onEdit?: (soal: Soal) => void
    onDelete?: (soalId: string) => void
    /** Hides edit/delete while the parent try out is published or expired. */
    locked?: boolean
    loading?: boolean
  }

  let { soalList = [], selectedSoalId, onSelect, onEdit, onDelete, locked = false, loading = false }: Props = $props()
  let deleting = $state<string | null>(null)

  async function handleDelete(soal: Soal) {
    if (!confirm(`Hapus soal: ${soal.pertanyaan.substring(0, 50)}...?`)) return

    deleting = soal.id
    try {
      await softDeleteSoal(soal.id)
      onDelete?.(soal.id)
    } catch (err) {
      console.error('Error deleting soal:', err)
      alert(err instanceof Error ? err.message : 'Gagal menghapus soal')
    } finally {
      deleting = null
    }
  }
</script>

<div class="border-r border-gray-200 bg-gray-50">
  <div class="p-4">
    <h3 class="text-sm font-semibold text-gray-900">Daftar Soal</h3>
    <p class="text-xs text-gray-500">{soalList.length} soal</p>
  </div>

  <div class="space-y-1 px-2 pb-4">
    {#each soalList as soal (soal.id)}
      <div class="flex items-start gap-2">
        <button
          onclick={() => onSelect?.(soal.id)}
          class={`flex-1 rounded-md px-3 py-2 text-left text-sm transition-colors ${
            selectedSoalId === soal.id
              ? 'bg-primary/10 text-primary'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span class="block font-medium">Soal {soal.nomor_urut}</span>
          <span class="block truncate text-xs text-gray-600">
            {soal.pertanyaan.substring(0, 40)}...
          </span>
        </button>

        {#if selectedSoalId === soal.id && !locked}
          <div class="flex gap-1 py-2">
            <button
              onclick={() => onEdit?.(soal)}
              title="Edit"
              class="rounded-md bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
            >
              ✏️
            </button>
            <button
              onclick={() => handleDelete(soal)}
              disabled={deleting === soal.id}
              title="Hapus"
              class="rounded-md bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              🗑️
            </button>
          </div>
        {/if}
      </div>
    {/each}

    {#if soalList.length === 0}
      <p class="px-3 py-4 text-center text-sm text-gray-500">
        Belum ada soal. Buat soal baru di kanan.
      </p>
    {/if}
  </div>
</div>
