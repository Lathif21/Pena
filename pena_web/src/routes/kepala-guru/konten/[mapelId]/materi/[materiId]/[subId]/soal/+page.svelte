<script lang="ts">
  import { goto } from '$app/navigation'
  import SoalForm from '$features/question/components/SoalForm.svelte'
  import SoalList from '$features/question/components/SoalList.svelte'
  import { listSoalBySubMateri } from '$features/question/data/soal'

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

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-7xl px-4 py-8">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <button
          onclick={() => goto(`/kepala-guru/konten/${data.mapel.id}/materi/${data.materi.id}`)}
          class="mb-4 text-sm font-medium text-primary hover:underline"
        >
          ← Kembali ke {data.materi.nama}
        </button>
        <h1 class="text-2xl font-bold text-gray-900">
          Kelola Soal Latihan
        </h1>
        <p class="mt-1 text-sm text-gray-600">
          {data.subMateri.nama} ({data.mapel.nama})
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <!-- Sidebar: Soal List -->
      <div class="rounded-2xl border border-gray-200 bg-white overflow-hidden lg:col-span-1">
        <SoalList
          soalList={soalList}
          selectedSoalId={selectedSoalId}
          onSelect={handleSelectSoal}
          onEdit={handleEditSoal}
          onDelete={handleDeleteSoal}
        />
      </div>

      <!-- Main: Form atau Preview -->
      <div class="lg:col-span-3">
        {#if showForm || (editingSoal && !selectedSoalId)}
          <!-- Form Mode -->
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
          <!-- Preview Mode -->
          <div class="space-y-6">
            <div class="rounded-2xl border border-gray-200 bg-white p-6">
              <div class="mb-4 flex items-start justify-between">
                <h2 class="text-lg font-semibold text-gray-900">
                  Soal {editingSoal.nomor_urut}
                </h2>
                <button
                  onclick={() => handleEditSoal(editingSoal)}
                  class="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  ✏️ Edit
                </button>
              </div>

              <div class="mb-6 rounded-lg bg-gray-50 p-4">
                <p class="text-gray-900">{editingSoal.pertanyaan}</p>
              </div>

              <div class="space-y-2">
                <p class="text-sm font-medium text-gray-700">Pilihan Jawaban:</p>
                {#each editingSoal.pilihan as pilihan (pilihan.id)}
                  <div
                    class={`rounded-lg p-3 ${
                      pilihan.is_benar
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div class="flex items-start gap-3">
                      <span
                        class={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          pilihan.is_benar
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-300 text-gray-700'
                        }`}
                      >
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
          </div>
        {:else}
          <!-- Empty State -->
          <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p class="mb-4 text-gray-600">Belum ada soal latihan.</p>
            <button
              onclick={() => {
                showForm = true
                editingSoal = null
              }}
              class="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
            >
              + Buat Soal Pertama
            </button>
          </div>
        {/if}

        <!-- Add Button -->
        {#if !showForm && (!editingSoal || selectedSoalId)}
          <div class="mt-6">
            <button
              onclick={() => {
                showForm = true
                editingSoal = null
                selectedSoalId = null
              }}
              class="w-full rounded-lg border border-primary bg-primary/5 px-4 py-3 font-medium text-primary hover:bg-primary/10"
            >
              + Tambah Soal Baru
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
