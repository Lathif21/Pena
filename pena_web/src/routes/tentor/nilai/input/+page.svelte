<script lang="ts">
  import { goto } from '$app/navigation'
  import { SvelteMap } from 'svelte/reactivity'
  import { listSiswaByTentor, createNilaiManual } from '$features/grading/data/nilai-manual'

  let { data } = $props()

  let selectedMapelId = $state('')
  let tipeTest = $state<'pre_test' | 'try_out' | 'post_test'>('try_out')
  let judul = $state('')
  let tanggal = $state(new Date().toISOString().split('T')[0])
  let siswaList = $state<any[]>([])
  // SvelteMap, not Map: a plain Map in $state is not reactive when mutated.
  let nilaiInput = new SvelteMap<string, { nilai: number | null; catatan: string }>()
  let loading = $state(false)
  let submitting = $state(false)
  let error = $state('')
  let message = $state('')

  async function handleSelectMapel() {
    if (!selectedMapelId) { siswaList = []; return }
    loading = true; error = ''
    try {
      siswaList = await listSiswaByTentor(data.tentorId, selectedMapelId, data.user.tahun_ajaran_id)
      nilaiInput.clear()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal mengambil daftar siswa'
      siswaList = []
    } finally {
      loading = false
    }
  }

  function updateSiswaInput(siswaDetailId: string, nilai: number | null, catatan: string) {
    nilaiInput.set(siswaDetailId, { nilai, catatan })
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!selectedMapelId || !judul || !tanggal) { error = 'Semua field wajib diisi'; return }
    const hasInput = Array.from(nilaiInput.values()).some(v => v.nilai !== null)
    if (!hasInput) { error = 'Minimal 1 siswa harus memiliki nilai'; return }

    submitting = true; error = ''; message = ''
    try {
      let successCount = 0
      for (const [siswaDetailId, input] of nilaiInput.entries()) {
        if (input.nilai !== null && input.nilai >= 0 && input.nilai <= 100) {
          await createNilaiManual(siswaDetailId, selectedMapelId, tipeTest, judul, tanggal, input.nilai, input.catatan || null)
          successCount++
        }
      }
      message = `Berhasil menyimpan ${successCount} nilai`
      setTimeout(() => { goto('/tentor/nilai') }, 1500)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal menyimpan nilai'
    } finally {
      submitting = false
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div class="mb-8">
      <button onclick={() => goto('/tentor/nilai')} class="mb-4 text-sm font-medium text-primary hover:underline">← Kembali</button>
      <h1 class="text-2xl font-bold text-gray-900">Input Nilai Manual</h1>
      <p class="mt-1 text-sm text-gray-600">Masukkan nilai dari ujian atau tugas tertulis</p>
    </div>

    {#if error}
      <div class="mb-4 rounded-md bg-red-50 p-4"><p class="text-sm text-red-800">{error}</p></div>
    {/if}
    {#if message}
      <div class="mb-4 rounded-md bg-emerald-50 p-4"><p class="text-sm text-emerald-800">✓ {message}</p></div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Pilih Mapel & Tipe Test</h2>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label for="mapel" class="block text-sm font-medium text-gray-700">Mata Pelajaran</label>
            <select id="mapel" bind:value={selectedMapelId} onchange={handleSelectMapel} class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2">
              <option value="">Pilih Mapel...</option>
              {#each data.mapel as m (m.id)}
                <option value={m.id}>{m.nama}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="tipeTest" class="block text-sm font-medium text-gray-700">Tipe Test</label>
            <select id="tipeTest" bind:value={tipeTest} class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2">
              <option value="pre_test">Pre-Test</option>
              <option value="try_out">Try Out</option>
              <option value="post_test">Post-Test</option>
            </select>
          </div>
          <div>
            <label for="tanggal" class="block text-sm font-medium text-gray-700">Tanggal</label>
            <input id="tanggal" type="date" bind:value={tanggal} class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
          </div>
        </div>
        <div>
          <label for="judul" class="mt-4 block text-sm font-medium text-gray-700">Judul / Deskripsi</label>
          <input id="judul" type="text" bind:value={judul} placeholder="Contoh: Ulangan Harian Bab 1" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
      </div>

      {#if selectedMapelId}
        <div class="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">Daftar Siswa ({siswaList.length})</h2>
          {#if loading}
            <p class="text-gray-600">Memuat daftar siswa...</p>
          {:else if siswaList.length === 0}
            <p class="text-gray-600">Tidak ada siswa yang diajar untuk mapel ini.</p>
          {:else}
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Nama Siswa</th>
                    <th class="px-4 py-3 text-center text-sm font-medium text-gray-700">Nilai</th>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Catatan (Opsional)</th>
                  </tr>
                </thead>
                <tbody>
                  {#each siswaList as siswa (siswa.siswa_detail_id)}
                    {@const currentInput = nilaiInput.get(siswa.siswa_detail_id) || { nilai: null, catatan: '' }}
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                      <td class="px-4 py-3 text-sm text-gray-900">{siswa.nama_lengkap}</td>
                      <td class="px-4 py-3 text-center">
                        <input type="number" min="0" max="100" value={currentInput.nilai || ''} onchange={(e) => updateSiswaInput(siswa.siswa_detail_id, e.currentTarget.value ? parseInt(e.currentTarget.value) : null, currentInput.catatan)} placeholder="—" class="w-20 rounded-md border border-gray-300 px-2 py-1 text-center text-sm" />
                      </td>
                      <td class="px-4 py-3">
                        <input type="text" value={currentInput.catatan} onchange={(e) => updateSiswaInput(siswa.siswa_detail_id, currentInput.nilai, e.currentTarget.value)} placeholder="Catatan..." class="w-full rounded-md border border-gray-300 px-2 py-1 text-sm" />
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      {/if}

      <div class="flex gap-3">
        <button type="submit" disabled={submitting || !selectedMapelId || siswaList.length === 0} class="rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary-hover disabled:opacity-50">
          {submitting ? 'Menyimpan...' : 'Simpan Nilai'}
        </button>
        <button type="button" onclick={() => goto('/tentor/nilai')} class="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50">Batal</button>
      </div>
    </form>
  </div>
</div>
