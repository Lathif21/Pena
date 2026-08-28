<script lang="ts">
  import SoalForm from '$features/question/components/SoalForm.svelte'
  import SoalList from '$features/question/components/SoalList.svelte'
  import { listSoalBySubMateri } from '$features/question/data/soal'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import { Pencil } from 'lucide-svelte'

  let { data } = $props()

  let soalList = $state(data.soal)
  let selectedSoalId = $state<string | null>(null)
  let editingSoal = $state<any>(null)
  let showForm = $state(false)
  let refreshing = $state(false)

  async function refreshSoal() {
    refreshing = true
    try {
      soalList = await listSoalBySubMateri(data.subMateri.id)
      selectedSoalId = null
      editingSoal = null
      showForm = false
    } catch (err) {
      console.error('Error refreshing soal:', err)
    } finally {
      refreshing = false
    }
  }

  function handleSelectSoal(soalId: string) {
    selectedSoalId = soalId
    const soal = soalList.find(s => s.id === soalId)
    editingSoal = soal
    showForm = false
  }

  function handleEditSoal(soal: any) {
    editingSoal = soal
    showForm = true
  }

  function handleDeleteSoal(soalId: string) {
    soalList = soalList.filter(s => s.id !== soalId)
    if (selectedSoalId === soalId) {
      selectedSoalId = null
      editingSoal = null
    }
  }
</script>

<div class="mb-6">
  <a
    href="/kepala-guru/konten/{data.mapel.id}/materi/{data.materi.id}"
    class="text-sm font-medium text-primary hover:underline"
  >
    ← Kembali ke {data.materi.nama}
  </a>
  <h1 class="mt-4 font-serif text-2xl text-foreground">Kelola Soal Latihan</h1>
  <p class="mt-1 text-sm text-muted-foreground">{data.subMateri.nama} ({data.mapel.nama})</p>
</div>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
  <div class="overflow-hidden rounded-xl border border-border bg-card lg:col-span-1">
    <SoalList
      {soalList}
      {selectedSoalId}
      onSelect={handleSelectSoal}
      onEdit={handleEditSoal}
      onDelete={handleDeleteSoal}
    />
  </div>

  <div class="lg:col-span-3">
    {#if showForm || (editingSoal && !selectedSoalId)}
      <SoalForm
        parentId={data.subMateri.id}
        parentType="sub_materi"
        initial={editingSoal}
        onSuccess={refreshSoal}
        onCancel={() => {
          showForm = false
          editingSoal = null
          selectedSoalId = null
        }}
      />
    {:else if selectedSoalId && editingSoal}
      <Card>
        <div class="mb-4 flex items-start justify-between gap-4">
          <h2 class="font-serif text-lg text-foreground">
            Soal <span class="font-mono">{editingSoal.nomor_urut}</span>
          </h2>
          <Button variant="secondary" onclick={() => handleEditSoal(editingSoal)}>
            <Pencil class="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>

        <div class="mb-6 rounded-lg bg-muted/30 p-4">
          <p class="text-foreground">{editingSoal.pertanyaan}</p>
        </div>

        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">Pilihan Jawaban:</p>
          {#each editingSoal.pilihan as pilihan (pilihan.id)}
            <div
              class="rounded-lg border p-3 {pilihan.is_benar
                ? 'border-emerald-300 bg-emerald-100'
                : 'border-border bg-muted/30'}"
            >
              <div class="flex items-start gap-3">
                <span
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-medium {pilihan.is_benar
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-muted text-muted-foreground'}"
                >
                  {pilihan.nomor_urut}
                </span>
                <div class="flex-1">
                  <p class="text-foreground">{pilihan.teks}</p>
                  {#if pilihan.is_benar}
                    <span class="text-xs font-medium text-emerald-800">✓ Jawaban Benar</span>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </Card>
    {:else}
      <Card class="p-8 text-center">
        <p class="mb-4 text-sm text-muted-foreground">Belum ada soal latihan.</p>
        <Button
          onclick={() => {
            showForm = true
            editingSoal = null
          }}
        >
          + Buat Soal Pertama
        </Button>
      </Card>
    {/if}

    {#if !showForm && (!editingSoal || selectedSoalId)}
      <Button
        variant="secondary"
        class="mt-6 w-full"
        onclick={() => {
          showForm = true
          editingSoal = null
          selectedSoalId = null
        }}
      >
        + Tambah Soal Baru
      </Button>
    {/if}
  </div>
</div>
