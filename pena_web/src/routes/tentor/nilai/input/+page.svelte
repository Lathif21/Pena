<script lang="ts">
  import { goto } from '$app/navigation'
  import { SvelteMap } from 'svelte/reactivity'
  import { createNilaiManual } from '$features/grading/data/nilai-manual'

  let { data } = $props()

  let tipeTest = $state<'pre_test' | 'try_out' | 'post_test'>('try_out')
  let judul = $state('')
  let tanggal = $state(new Date().toISOString().split('T')[0])
  // SvelteMap, not Map: a plain Map in $state is not reactive when mutated.
  let nilaiInput = new SvelteMap<string, { nilai: number | null; catatan: string }>()
  let submitting = $state(false)
  let error = $state('')
  let message = $state('')

  const NILAI_MAX = 100

  // Mapel lives in the URL so the server resolves the student list from the
  // tentor's own assignments.
  function pilihMapel(mapelId: string) {
    nilaiInput.clear()
    goto(mapelId ? `/tentor/nilai/input?mapel=${mapelId}` : '/tentor/nilai/input', {
      keepFocus: true,
      noScroll: true
    })
  }

  function bacaNilai(raw: string) {
    if (raw.trim() === '') return null
    const n = Number(raw)
    if (!Number.isFinite(n)) return null
    // Clamp rather than silently drop — the old version skipped out-of-range values
    // at submit time, so a typo just vanished without telling anyone.
    return Math.max(0, Math.min(NILAI_MAX, Math.round(n)))
  }

  function setNilai(siswaDetailId: string, raw: string, catatan: string) {
    nilaiInput.set(siswaDetailId, { nilai: bacaNilai(raw), catatan })
  }

  function setCatatan(siswaDetailId: string, catatan: string) {
    const current = nilaiInput.get(siswaDetailId)
    nilaiInput.set(siswaDetailId, { nilai: current?.nilai ?? null, catatan })
  }

  let terisi = $derived(
    [...nilaiInput.values()].filter((v) => v.nilai !== null).length
  )

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!data.mapelId) { error = 'Pilih mapel dulu'; return }
    if (!judul.trim()) { error = 'Judul wajib diisi'; return }
    if (!tanggal) { error = 'Tanggal wajib diisi'; return }
    if (terisi === 0) { error = 'Minimal 1 siswa harus memiliki nilai'; return }

    submitting = true; error = ''; message = ''
    try {
      let tersimpan = 0
      for (const [siswaDetailId, input] of nilaiInput.entries()) {
        if (input.nilai === null) continue
        await createNilaiManual(
          siswaDetailId,
          data.mapelId,
          tipeTest,
          judul.trim(),
          tanggal,
          input.nilai,
          input.catatan?.trim() || null
        )
        tersimpan++
      }
      message = `Berhasil menyimpan ${tersimpan} nilai`
      setTimeout(() => goto('/tentor/nilai'), 1500)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal menyimpan nilai'
    } finally {
      submitting = false
    }
  }
</script>

<div class="mx-auto max-w-4xl">
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
          <select
            id="mapel"
            value={data.mapelId}
            onchange={(e) => pilihMapel((e.currentTarget as HTMLSelectElement).value)}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 pr-8 py-2"
          >
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

    {#if data.mapelId}
      <div class="rounded-2xl border border-gray-200 bg-white p-6">
        <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-lg font-semibold text-gray-900">Daftar Siswa ({data.siswa.length})</h2>
          <p class="text-xs text-gray-500">Hanya siswa dari kelas yang Anda ajar · nilai 0–{NILAI_MAX}</p>
        </div>

        {#if data.siswa.length === 0}
          <p class="text-gray-600">Tidak ada siswa yang Anda ajar untuk mapel ini.</p>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Nama Siswa</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Kelas</th>
                  <th class="px-4 py-3 text-center text-sm font-medium text-gray-700">Nilai</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Catatan (Opsional)</th>
                </tr>
              </thead>
              <tbody>
                {#each data.siswa as siswa (siswa.siswa_detail_id)}
                  {@const current = nilaiInput.get(siswa.siswa_detail_id) ?? { nilai: null, catatan: '' }}
                  <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm">
                      <span class="block text-gray-900">{siswa.nama_lengkap}</span>
                      <span class="text-xs text-gray-500">{siswa.nis}</span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {siswa.kelas}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max={NILAI_MAX}
                        step="1"
                        value={current.nilai ?? ''}
                        oninput={(e) => setNilai(siswa.siswa_detail_id, e.currentTarget.value, current.catatan)}
                        placeholder="—"
                        class="w-20 rounded-md border border-gray-300 px-2 py-1 text-center text-sm"
                      />
                    </td>
                    <td class="px-4 py-3">
                      <input
                        type="text"
                        value={current.catatan}
                        oninput={(e) => setCatatan(siswa.siswa_detail_id, e.currentTarget.value)}
                        placeholder="Catatan..."
                        class="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
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
      <button
        type="submit"
        disabled={submitting || !data.mapelId || data.siswa.length === 0 || terisi === 0}
        class="rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90 disabled:opacity-50"
      >
        {submitting ? 'Menyimpan...' : `Simpan Nilai (${terisi})`}
      </button>
      <button type="button" onclick={() => goto('/tentor/nilai')} class="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50">Batal</button>
    </div>
  </form>
</div>
