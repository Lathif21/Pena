<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import SoalForm from '$features/question/components/SoalForm.svelte'
  import SoalList from '$features/question/components/SoalList.svelte'
  import TryOutForm from '$features/question/components/TryOutForm.svelte'
  import { listSoalByTryOut } from '$features/question/data/soal'
  import { publishTryOut, unpublishTryOut, deleteTryOut } from '$features/question/data/try-out'
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import { Pencil } from 'lucide-svelte'

  let { data } = $props()

  // $derived, not $state: a $state copy snapshots data.tryOut once at init and then
  // ignores it, so a newly created try out never appears until a full page reload.
  let tryOutList = $derived(data.tryOut)
  let soalList = $state<any[]>([])
  let selectedTryOutId = $state<string | null>(data.tryOut[0]?.id ?? null)
  let selectedSoalId = $state<string | null>(null)
  let selectedSoal = $state<any>(null)
  let showTryOutForm = $state(false)
  let editingTryOut = $state<any>(null)
  let showSoalForm = $state(false)
  let publishing = $state(false)
  let publishError = $state('')

  // Soal are frozen while THIS try out is published, and permanently once it expires.
  let selectedTryOut = $derived(tryOutList.find((t) => t.id === selectedTryOutId) ?? null)
  let soalLock = $derived(selectedTryOut?.soalLock ?? { locked: false, reason: '' })
  let soalLocked = $derived(soalLock.locked)

  async function handlePublishTryOut(tryOutId: string) {
    if (!confirm('Publish try out ini? Soal akan terkunci selama try out dipublish.')) return

    publishing = true
    publishError = ''
    try {
      await publishTryOut(tryOutId)
      await invalidateAll()
    } catch (err) {
      publishError = err instanceof Error ? err.message : 'Gagal publish try out'
    } finally {
      publishing = false
    }
  }

  async function handleUnpublishTryOut(tryOutId: string) {
    if (!confirm('Batalkan publish? Try out hilang dari halaman siswa sampai dipublish lagi.')) return

    publishing = true
    publishError = ''
    try {
      await unpublishTryOut(tryOutId)
      await invalidateAll()
    } catch (err) {
      publishError = err instanceof Error ? err.message : 'Gagal membatalkan publish'
    } finally {
      publishing = false
    }
  }

  async function handleDeleteTryOut(tryOut: { id: string; judul: string }) {
    if (!confirm(`Hapus try out "${tryOut.judul}"? Soal di dalamnya ikut terhapus.`)) return

    publishing = true
    publishError = ''
    try {
      await deleteTryOut(tryOut.id)
      // Fall back to whatever is left, so the panel never points at a deleted row.
      selectedTryOutId = tryOutList.find((t) => t.id !== tryOut.id)?.id ?? null
      await invalidateAll()
    } catch (err) {
      publishError = err instanceof Error ? err.message : 'Gagal menghapus try out'
    } finally {
      publishing = false
    }
  }

  // Reload whenever the selected try out changes — each try out owns its own soal.
  $effect(() => {
    const id = selectedTryOutId
    if (!id) {
      soalList = []
      return
    }
    loadSoal(id)
  })

  async function loadSoal(tryOutId = selectedTryOutId) {
    if (!tryOutId) return
    try {
      soalList = await listSoalByTryOut(tryOutId)
      selectedSoalId = null
      selectedSoal = null
    } catch (err) {
      console.error('Error loading soal:', err)
    }
  }

  function selectTryOut(tryOutId: string) {
    selectedTryOutId = tryOutId
    showTryOutForm = false
  }

  function selectSoal(soalId: string) {
    selectedSoalId = soalId
    selectedSoal = soalList.find(s => s.id === soalId)
  }

  function editSoal(soal: any) {
    selectedSoal = soal
    showSoalForm = true
  }

  function deleteSoal(soalId: string) {
    soalList = soalList.filter(s => s.id !== soalId)
    if (selectedSoalId === soalId) {
      selectedSoalId = null
      selectedSoal = null
    }
  }
</script>

<svelte:head>
  <title>{data.materi.nama} — Try Out · Pena</title>
</svelte:head>

<div class="mb-6">
  <a
    href="/kepala-guru/konten/{data.mapel.id}/materi"
    class="text-sm font-medium text-primary hover:underline"
  >
    ← Kembali ke {data.mapel.nama}
  </a>
  <h1 class="mt-4 font-serif text-2xl text-foreground">Kelola Try Out</h1>
  <p class="mt-1 text-sm text-muted-foreground">{data.materi.nama}</p>
</div>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
  <div class="lg:col-span-1">
    <div class="overflow-hidden rounded-xl border border-border bg-card">
      <div class="border-b border-border p-4">
        <h3 class="font-serif text-base text-foreground">Try Out</h3>
        <p class="text-xs text-muted-foreground">
          <span class="font-mono">{tryOutList.length}</span> dibuat
        </p>
      </div>
      <div class="max-h-96 overflow-y-auto">
        {#each tryOutList as to (to.id)}
          <button
            onclick={() => selectTryOut(to.id)}
            class="w-full border-b border-border px-4 py-3 text-left {selectedTryOutId === to.id
              ? 'bg-secondary'
              : 'hover:bg-muted/30'}"
          >
            <p class="truncate text-sm font-medium text-foreground">{to.judul}</p>
            <p class="text-xs text-muted-foreground">
              {to.status === 'published' ? 'Published' : 'Draft'}
            </p>
          </button>
        {/each}
      </div>
      <div class="border-t border-border p-3">
        <Button
          variant="secondary"
          class="w-full"
          onclick={() => {
            showTryOutForm = true
            editingTryOut = null
            selectedTryOutId = null
          }}
        >
          + Buat Try Out
        </Button>
      </div>
    </div>
  </div>

  <div class="lg:col-span-3">
    {#if showTryOutForm}
      <TryOutForm
        materiId={data.materi.id}
        kelasOptions={data.kelas}
        initial={editingTryOut}
        onSuccess={async () => {
          showTryOutForm = false
          editingTryOut = null
          await invalidateAll()
        }}
        onCancel={() => {
          showTryOutForm = false
          editingTryOut = null
        }}
      />
    {:else if selectedTryOutId}
      {@const tryOut = tryOutList.find((t) => t.id === selectedTryOutId)}
      {#if tryOut}
        <Card class="mb-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 class="font-serif text-lg text-foreground">{tryOut.judul}</h2>
              <p class="mt-1 text-sm text-muted-foreground">
                <span class="font-mono">{tryOut.durasi_menit}</span> menit · {tryOut.tipe_test} ·
                <span class="font-mono">{soalList.length}</span> soal
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                Buka
                <span class="font-mono">
                  {new Date(tryOut.waktu_buka).toLocaleString('id-ID')}
                </span>
              </p>
            </div>
            {#if tryOut.status === 'published'}
              <div class="flex flex-wrap items-center gap-3">
                <Badge tone="success">Published</Badge>
                {#if tryOut.expired}
                  <span class="text-sm text-muted-foreground">Terkunci — waktu sudah lewat</span>
                {:else}
                  <Button
                    variant="secondary"
                    onclick={() => handleUnpublishTryOut(tryOut.id)}
                    disabled={publishing}
                  >
                    {publishing ? 'Memproses...' : 'Batalkan Publish'}
                  </Button>
                {/if}
              </div>
            {:else}
              <div class="flex flex-wrap items-center gap-3">
                <Badge tone="pending">Draft</Badge>
                <Button
                  variant="secondary"
                  onclick={() => {
                    editingTryOut = tryOut
                    showTryOutForm = true
                  }}
                >
                  Edit Jadwal
                </Button>
                <Button onclick={() => handlePublishTryOut(tryOut.id)} disabled={publishing}>
                  {publishing ? 'Memproses...' : 'Publish'}
                </Button>
                <Button
                  variant="destructive"
                  onclick={() => handleDeleteTryOut(tryOut)}
                  disabled={publishing}
                >
                  Hapus
                </Button>
              </div>
            {/if}
          </div>
          {#if publishError}
            <div class="mt-4 rounded-lg bg-red-100 p-3">
              <p class="text-sm text-red-800">{publishError}</p>
            </div>
          {/if}
        </Card>
      {/if}

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div class="overflow-hidden rounded-xl border border-border bg-card lg:col-span-1">
          <SoalList
            {soalList}
            {selectedSoalId}
            onSelect={selectSoal}
            onEdit={editSoal}
            onDelete={deleteSoal}
            locked={soalLocked}
          />
        </div>

        <div class="lg:col-span-3">
          {#if showSoalForm}
            <!-- initial null = tambah soal baru. Previously this branch also
                 required selectedSoal, so "Tambah Soal" rendered nothing. -->
            <SoalForm
              parentId={selectedTryOutId}
              parentType="try_out"
              initial={selectedSoal}
              onSuccess={() => {
                loadSoal()
                showSoalForm = false
                selectedSoal = null
              }}
              onCancel={() => {
                showSoalForm = false
              }}
            />
          {:else if selectedSoalId && selectedSoal}
            <Card>
              <div class="mb-4 flex items-start justify-between gap-4">
                <h3 class="font-serif text-lg text-foreground">
                  Soal <span class="font-mono">{selectedSoal.nomor_urut}</span>
                </h3>
                {#if soalLocked}
                  <span class="text-xs text-muted-foreground">{soalLock.reason}</span>
                {:else}
                  <Button variant="secondary" onclick={() => editSoal(selectedSoal)}>
                    <Pencil class="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                {/if}
              </div>
              <div class="mb-6 rounded-lg bg-muted/30 p-4">
                <p class="text-foreground">{selectedSoal.pertanyaan}</p>
              </div>
              <div class="space-y-2">
                <p class="text-sm font-medium text-foreground">Pilihan Jawaban:</p>
                {#each selectedSoal.pilihan as pilihan (pilihan.id)}
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
              <p class="text-sm text-muted-foreground">Belum ada soal untuk try out ini.</p>
              {#if soalLocked}
                <p class="mt-2 text-sm text-muted-foreground">{soalLock.reason}</p>
              {:else}
                <Button
                  class="mt-4"
                  onclick={() => {
                    showSoalForm = true
                    selectedSoal = null
                  }}
                >
                  + Tambah Soal
                </Button>
              {/if}
            </Card>
          {/if}

          {#if !showSoalForm && soalList.length > 0}
            <div class="mt-6">
              {#if soalLocked}
                <div class="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center">
                  <p class="text-sm text-muted-foreground">{soalLock.reason}</p>
                </div>
              {:else}
                <Button
                  variant="secondary"
                  class="w-full"
                  onclick={() => {
                    showSoalForm = true
                    selectedSoal = null
                    selectedSoalId = null
                  }}
                >
                  + Tambah Soal
                </Button>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <Card class="p-8 text-center">
        <p class="text-sm text-muted-foreground">
          Pilih atau buat try out untuk mulai mengelola soal.
        </p>
        <Button
          class="mt-4"
          onclick={() => {
            showTryOutForm = true
            editingTryOut = null
          }}
        >
          + Buat Try Out Pertama
        </Button>
      </Card>
    {/if}
  </div>
</div>
