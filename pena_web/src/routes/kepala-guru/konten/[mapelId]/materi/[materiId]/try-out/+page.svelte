<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation'
  import SoalForm from '$features/question/components/SoalForm.svelte'
  import SoalList from '$features/question/components/SoalList.svelte'
  import TryOutForm from '$features/question/components/TryOutForm.svelte'
  import { listSoalByTryOut } from '$features/question/data/soal'
  import { publishTryOut, unpublishTryOut, deleteTryOut } from '$features/question/data/try-out'

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

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8">
      <button onclick={() => goto(`/kepala-guru/konten/${data.mapel.id}/materi`)} class="mb-4 text-sm font-medium text-primary hover:underline">
        ← Kembali ke {data.mapel.nama}
      </button>
      <h1 class="text-2xl font-bold text-gray-900">Kelola Try Out</h1>
      <p class="mt-1 text-sm text-gray-600">{data.materi.nama}</p>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div class="lg:col-span-1">
        <div class="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div class="border-b border-gray-200 p-4">
            <h3 class="font-semibold text-gray-900">Try Out</h3>
            <p class="text-xs text-gray-500">{tryOutList.length} dibuat</p>
          </div>
          <div class="max-h-96 overflow-y-auto">
            {#each tryOutList as to (to.id)}
              <button
                onclick={() => selectTryOut(to.id)}
                class={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors ${selectedTryOutId === to.id ? 'bg-primary/10' : 'hover:bg-gray-50'}`}
              >
                <p class="font-medium text-gray-900 truncate">{to.judul}</p>
                <p class="text-xs text-gray-500">{to.status === 'published' ? '✓ Published' : '○ Draft'}</p>
              </button>
            {/each}
          </div>
          <div class="border-t border-gray-200 p-3">
            <button onclick={() => { showTryOutForm = true; editingTryOut = null; selectedTryOutId = null }} class="w-full rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20">
              + Buat Try Out
            </button>
          </div>
        </div>
      </div>

      <div class="lg:col-span-3">
        {#if showTryOutForm}
          <TryOutForm
            materiId={data.materi.id}
            kelasOptions={data.kelas}
            initial={editingTryOut}
            onSuccess={async () => { showTryOutForm = false; editingTryOut = null; await invalidateAll() }}
            onCancel={() => { showTryOutForm = false; editingTryOut = null }}
          />
        {:else if selectedTryOutId}
          {@const tryOut = tryOutList.find(t => t.id === selectedTryOutId)}
          {#if tryOut}
            <div class="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 class="text-lg font-semibold text-gray-900">{tryOut.judul}</h2>
                  <p class="mt-1 text-sm text-gray-600">
                    {tryOut.durasi_menit} menit • {tryOut.tipe_test} • {soalList.length} soal
                  </p>
                  <p class="mt-1 text-xs text-gray-500">
                    Buka {new Date(tryOut.waktu_buka).toLocaleString('id-ID')}
                  </p>
                </div>
                {#if tryOut.status === 'published'}
                  <div class="flex items-center gap-3">
                    <span class="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">✓ Published</span>
                    {#if tryOut.expired}
                      <span class="text-sm text-gray-500">Terkunci — waktu sudah lewat</span>
                    {:else}
                      <button
                        onclick={() => handleUnpublishTryOut(tryOut.id)}
                        disabled={publishing}
                        class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {publishing ? 'Memproses...' : 'Batalkan Publish'}
                      </button>
                    {/if}
                  </div>
                {:else}
                  <div class="flex items-center gap-3">
                    <span class="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">○ Draft</span>
                    <button
                      onclick={() => { editingTryOut = tryOut; showTryOutForm = true }}
                      class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit Jadwal
                    </button>
                    <button
                      onclick={() => handlePublishTryOut(tryOut.id)}
                      disabled={publishing}
                      class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                    >
                      {publishing ? 'Memproses...' : 'Publish'}
                    </button>
                    <button
                      onclick={() => handleDeleteTryOut(tryOut)}
                      disabled={publishing}
                      class="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-danger hover:bg-red-50 disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  </div>
                {/if}
              </div>
              {#if publishError}
                <div class="mt-4 rounded-md bg-red-50 p-3">
                  <p class="text-sm text-red-800">{publishError}</p>
                </div>
              {/if}
            </div>
          {/if}

          <div class="grid grid-cols-4 gap-6">
            <div class="col-span-1 rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <SoalList soalList={soalList} selectedSoalId={selectedSoalId} onSelect={selectSoal} onEdit={editSoal} onDelete={deleteSoal} locked={soalLocked} />
            </div>

            <div class="col-span-3">
              {#if showSoalForm}
                <!-- initial null = tambah soal baru. Previously this branch also
                     required selectedSoal, so "Tambah Soal" rendered nothing. -->
                <SoalForm
                  parentId={selectedTryOutId}
                  parentType="try_out"
                  initial={selectedSoal}
                  onSuccess={() => { loadSoal(); showSoalForm = false; selectedSoal = null }}
                  onCancel={() => { showSoalForm = false }}
                />
              {:else if selectedSoalId && selectedSoal}
                <div class="rounded-2xl border border-gray-200 bg-white p-6">
                  <div class="mb-4 flex justify-between items-start">
                    <h3 class="text-lg font-semibold text-gray-900">Soal {selectedSoal.nomor_urut}</h3>
                    {#if soalLocked}
                      <span class="text-xs text-gray-500">{soalLock.reason}</span>
                    {:else}
                      <button onclick={() => editSoal(selectedSoal)} class="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">✏️ Edit</button>
                    {/if}
                  </div>
                  <div class="mb-6 rounded-lg bg-gray-50 p-4">
                    <p class="text-gray-900">{selectedSoal.pertanyaan}</p>
                  </div>
                  <div class="space-y-2">
                    <p class="text-sm font-medium text-gray-700">Pilihan Jawaban:</p>
                    {#each selectedSoal.pilihan as pilihan (pilihan.id)}
                      <div class={`rounded-lg p-3 ${pilihan.is_benar ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <div class="flex items-start gap-3">
                          <span class={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${pilihan.is_benar ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
                            {pilihan.nomor_urut}
                          </span>
                          <div class="flex-1">
                            <p class="text-gray-900">{pilihan.teks}</p>
                            {#if pilihan.is_benar}
                              <span class="text-xs font-medium text-emerald-700">✓ Jawaban Benar</span>
                            {/if}
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {:else}
                <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center">
                  <p class="text-gray-600">Belum ada soal untuk try out ini.</p>
                  {#if soalLocked}
                    <p class="mt-2 text-sm text-gray-500">{soalLock.reason}</p>
                  {:else}
                    <button onclick={() => { showSoalForm = true; selectedSoal = null }} class="mt-4 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-hover">
                      + Tambah Soal
                    </button>
                  {/if}
                </div>
              {/if}

              {#if !showSoalForm && soalList.length > 0}
                <div class="mt-6">
                  {#if soalLocked}
                    <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center">
                      <p class="text-sm text-gray-600">{soalLock.reason}</p>
                    </div>
                  {:else}
                    <button onclick={() => { showSoalForm = true; selectedSoal = null; selectedSoalId = null }} class="w-full rounded-lg border border-primary bg-primary/5 px-4 py-3 font-medium text-primary hover:bg-primary/10">
                      + Tambah Soal
                    </button>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p class="text-gray-600">Pilih atau buat try out untuk mulai mengelola soal.</p>
            <button onclick={() => { showTryOutForm = true; editingTryOut = null }} class="mt-4 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-hover">
              + Buat Try Out Pertama
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
