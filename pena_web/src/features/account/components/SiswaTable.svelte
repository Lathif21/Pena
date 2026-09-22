<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { pesanRamah } from '$lib/utils/pesan'
  import { deleteSiswa, type Siswa } from '../data/siswa'
  import SiswaForm from './SiswaForm.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import Table from '$lib/components/Table.svelte'
  import Th from '$lib/components/Th.svelte'
  import Td from '$lib/components/Td.svelte'

  interface Props {
    siswa: Siswa[]
  }

  let { siswa }: Props = $props()
  let showForm = $state(false)
  let editingSiswa: Siswa | null = $state(null)
  let error = $state('')
  let sukses = $state('')

  async function loadSiswa() {
    await invalidateAll()
  }

  function handleEditClick(item: Siswa) {
    editingSiswa = item
    showForm = true
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus siswa ini?')) return

    try {
      await deleteSiswa(id)
      sukses = 'Siswa berhasil dihapus.'
      await loadSiswa()
    } catch (err) {
      error = pesanRamah(err, 'Gagal menghapus siswa.')
    }
  }

  async function handleCloseForm(tersimpan = false) {
    showForm = false
    editingSiswa = null
    loadSiswa()
    if (tersimpan) sukses = 'Siswa berhasil disimpan.'
  }

  // Regular biru, privat emas. Dua paket saja — bukan status, jadi tidak memakai
  // nada badge hadir/draft/error.
  const gayaPaket = (paket: string) =>
    paket === 'regular' ? 'bg-blue-100 text-blue-800' : 'bg-accent/15 text-accent'
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

  <Button onclick={() => (showForm = true)}>Tambah Siswa</Button>

  {#if showForm}
    <SiswaForm {editingSiswa} onclose={handleCloseForm} />
  {/if}

  <!-- Enam kolom bermakna — di bawah md jadi tumpukan card. -->
  <div class="space-y-3 md:hidden">
    {#each siswa as item (item.id)}
      <Card>
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-medium text-foreground">{item.nama_lengkap}</p>
            <p class="text-sm text-muted-foreground">{item.email}</p>
          </div>
          <span
            class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium {gayaPaket(item.paket)}"
          >
            {item.paket === 'regular' ? 'Regular' : 'Privat'}
          </span>
        </div>
        <dl class="mt-3 space-y-1 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-muted-foreground">Kelas</dt>
            <dd class="text-foreground">{item.kelas_nama ?? 'Belum ada kelas'}</dd>
          </div>
        </dl>
        <div class="mt-3 flex gap-2">
          <Button variant="secondary" class="flex-1" onclick={() => handleEditClick(item)}>
            Edit
          </Button>
          <Button variant="destructive" class="flex-1" onclick={() => handleDelete(item.id)}>
            Hapus
          </Button>
        </div>
      </Card>
    {/each}
  </div>

  <div class="hidden md:block">
    <Table>
      {#snippet head()}
        <Th>Nama</Th>
        <Th>Email</Th>
        <Th>Kelas</Th>
        <Th>Paket</Th>
        <Th>Aksi</Th>
      {/snippet}
      {#snippet body()}
        {#each siswa as item (item.id)}
          <tr class="border-b border-border">
            <Td>{item.nama_lengkap}</Td>
            <Td>{item.email}</Td>
            <Td>
              {#if item.kelas_nama}
                <span
                  class="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                >
                  {item.kelas_nama}
                </span>
              {:else}
                <span class="text-xs text-muted-foreground">Belum ada kelas</span>
              {/if}
            </Td>
            <Td>
              <span class="rounded-full px-2.5 py-1 text-xs font-medium {gayaPaket(item.paket)}">
                {item.paket === 'regular' ? 'Regular' : 'Privat'}
              </span>
            </Td>
            <Td class="space-x-3">
              <button onclick={() => handleEditClick(item)} class="text-primary hover:underline">
                Edit
              </button>
              <button
                onclick={() => handleDelete(item.id)}
                class="text-destructive hover:underline"
              >
                Hapus
              </button>
            </Td>
          </tr>
        {/each}
      {/snippet}
    </Table>
  </div>
</div>
