<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { pesanRamah } from '$lib/utils/pesan'
  import { setActiveTahunAjaran, type TahunAjaran } from '../data/tahun-ajaran'
  import TahunAjaranForm from './TahunAjaranForm.svelte'

  interface Props {
    tahunAjaran: TahunAjaran[]
  }

  let { tahunAjaran }: Props = $props()
  let showForm = $state(false)
  let error = $state('')
  let sukses = $state('')

  async function loadTahunAjaran() {
    await invalidateAll()
  }

  async function handleSetActive(id: string) {
    try {
      await setActiveTahunAjaran(id)
      sukses = 'Tahun ajaran berhasil dihapus.'
      await loadTahunAjaran()
    } catch (err) {
      error = pesanRamah(err, 'Gagal mengaktifkan tahun ajaran.')
    }
  }

  async function handleCloseForm(tersimpan = false) {
    showForm = false
    loadTahunAjaran()
    if (tersimpan) sukses = 'Tahun ajaran berhasil disimpan.'
  }
</script>

<div class="space-y-4">
  {#if error}
    <div class="rounded-lg bg-red-100 p-4">
      <p class="text-sm font-medium text-red-800">{error}</p>
    </div>
  {/if}

    {#if sukses}
      <div class="rounded-lg bg-emerald-100 p-4">
        <p class="text-sm font-medium text-emerald-800">✓ {sukses}</p>
      </div>
    {/if}

  <button
    onclick={() => (showForm = true)}
    class="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
  >
    Tambah Tahun Ajaran
  </button>

  {#if showForm}
    <TahunAjaranForm onclose={handleCloseForm} />
  {/if}

  <div class="overflow-x-auto rounded-lg border border-border">
      <table class="w-full divide-y divide-border">
        <thead class="bg-muted/30">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Nama</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each tahunAjaran as item (item.id)}
            <tr>
              <td class="px-4 py-3 text-sm text-foreground">{item.nama}</td>
              <td class="px-4 py-3 text-sm">
                {#if item.is_active}
                  <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-800">
                    Aktif
                  </span>
                {:else}
                  <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-muted text-foreground">
                    Tidak Aktif
                  </span>
                {/if}
              </td>
              <td class="px-4 py-3 text-sm">
                {#if !item.is_active}
                  <button
                    onclick={() => handleSetActive(item.id)}
                    class="text-primary hover:underline"
                  >
                    Aktifkan
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
</div>

