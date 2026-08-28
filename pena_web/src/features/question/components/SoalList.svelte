<script lang="ts">
  import { Pencil, Trash2 } from 'lucide-svelte'
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

<div class="border-r border-border bg-muted/30">
  <div class="p-4">
    <h3 class="font-serif text-sm text-foreground">Daftar Soal</h3>
    <p class="text-xs text-muted-foreground">
      <span class="font-mono">{soalList.length}</span> soal
    </p>
  </div>

  <div class="space-y-1 px-2 pb-4">
    {#each soalList as soal (soal.id)}
      <div class="flex items-start gap-2">
        <button
          onclick={() => onSelect?.(soal.id)}
          class={`flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
            selectedSoalId === soal.id
              ? 'bg-secondary text-secondary-foreground'
              : 'text-foreground hover:bg-muted'
          }`}
        >
          <span class="block font-medium">Soal <span class="font-mono">{soal.nomor_urut}</span></span>
          <span class="block truncate text-xs text-muted-foreground">
            {soal.pertanyaan.substring(0, 40)}...
          </span>
        </button>

        {#if selectedSoalId === soal.id && !locked}
          <div class="flex gap-1 py-2">
            <button
              onclick={() => onEdit?.(soal)}
              title="Edit"
              class="rounded-lg p-2.5 text-muted-foreground hover:bg-muted/40"
            >
              <Pencil class="h-4 w-4" />
            </button>
            <button
              onclick={() => handleDelete(soal)}
              disabled={deleting === soal.id}
              title="Hapus"
              class="rounded-lg p-2.5 text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        {/if}
      </div>
    {/each}

    {#if soalList.length === 0}
      <p class="px-3 py-4 text-center text-sm text-muted-foreground">
        Belum ada soal. Buat soal baru di kanan.
      </p>
    {/if}
  </div>
</div>
