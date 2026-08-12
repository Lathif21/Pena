<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { SvelteMap } from 'svelte/reactivity'
  import { startLatihan as apiStartLatihan, saveJawaban, submitAttempt } from '$features/question/data/attempt'

  let { data } = $props()

  // /siswa is not a route — the sub materi page is the real parent of a latihan.
  const kembaliUrl = `/siswa/mapel/${page.params.mapelId}/materi/${page.params.materiId}/${page.params.subId}`

  let attemptId = $state(data.attempt?.id || '')
  // SvelteMap, not Map: $state does not make built-in collections reactive, so
  // mutating a plain Map never re-renders the answer count or the selected radio.
  let jawaban = new SvelteMap<string, string>()
  let submitted = $state(!!data.attempt?.submitted_at)
  let nilai = $state(data.attempt?.nilai || 0)
  let loading = $state(false)
  let error = $state('')
  let message = $state('')

  async function startLatihan() {
    if (!data.siswaDetailId) { error = 'Siswa tidak ditemukan'; return }
    loading = true; error = ''
    try {
      const attempt = await apiStartLatihan(data.subMateri.id)
      attemptId = attempt.id; jawaban.clear(); submitted = false; nilai = 0
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal memulai latihan'
    } finally {
      loading = false
    }
  }

  async function handleSelectJawaban(soalId: string, pilihanId: string) {
    jawaban.set(soalId, pilihanId)
    if (!attemptId) return
    try {
      await saveJawaban(attemptId, soalId, pilihanId)
      message = 'Jawaban disimpan'
      setTimeout(() => (message = ''), 2000)
    } catch (err) {
      console.error('Error saving jawaban:', err)
    }
  }

  async function handleSubmit() {
    if (!attemptId) return
    loading = true; error = ''
    try {
      const score = await submitAttempt(attemptId)
      nilai = score; submitted = true; message = `Selesai! Nilai Anda: ${score}`
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal submit latihan'
    } finally {
      loading = false
    }
  }

  function handleRetry() {
    attemptId = ''; jawaban.clear(); submitted = false; nilai = 0; startLatihan()
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <button onclick={() => goto(kembaliUrl)} class="mb-4 text-sm font-medium text-primary hover:underline">← Kembali</button>
        <h1 class="text-2xl font-bold text-gray-900">Latihan: {data.subMateri.nama}</h1>
      </div>
    </div>

    {#if !attemptId}
      <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        {#if data.soal.length === 0}
          <p class="text-gray-600">Belum ada soal latihan untuk topik ini.</p>
        {:else}
          <h2 class="mb-4 text-xl font-semibold text-gray-900">Siap Memulai?</h2>
          <p class="mb-6 text-gray-600">Latihan soal ini terdiri dari <strong>{data.soal.length} soal</strong>. Anda bisa mengulang latihan ini berkali-kali.</p>
          <button onclick={startLatihan} disabled={loading} class="rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary-hover disabled:opacity-50">
            {loading ? 'Memulai...' : 'Mulai Latihan'}
          </button>
        {/if}
      </div>
    {:else if submitted}
      <div class="space-y-6">
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <h2 class="mb-2 text-2xl font-bold text-emerald-700">Selesai!</h2>
          <div class="mb-6">
            <div class="text-5xl font-bold text-emerald-600">{nilai}</div>
            <p class="mt-2 text-emerald-700">dari 100</p>
          </div>
          <div class="flex gap-3 justify-center">
            <button onclick={handleRetry} class="rounded-lg bg-emerald-600 px-6 py-3 text-white hover:bg-emerald-700">🔄 Ulangi Latihan</button>
            <button onclick={() => goto(kembaliUrl)} class="rounded-lg border border-emerald-600 px-6 py-3 text-emerald-700 hover:bg-emerald-50">Kembali</button>
          </div>
        </div>
      </div>
    {:else}
      {#if error}
        <div class="mb-4 rounded-md bg-red-50 p-4"><p class="text-sm text-red-800">{error}</p></div>
      {/if}
      {#if message}
        <div class="mb-4 rounded-md bg-emerald-50 p-4"><p class="text-sm text-emerald-800">✓ {message}</p></div>
      {/if}

      <div class="mb-6 rounded-lg bg-white p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">{jawaban.size} dari {data.soal.length} terjawab</span>
          <div class="h-2 w-32 rounded-full bg-gray-200">
            <div class="h-full rounded-full bg-primary transition-all" style="width: {Math.round((jawaban.size / data.soal.length) * 100)}%"></div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        {#each data.soal as soal (soal.id)}
          <div class="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 class="mb-4 text-lg font-semibold text-gray-900">Soal {soal.nomor_urut}</h3>
            <p class="mb-6 text-gray-900">{soal.pertanyaan}</p>
            <div class="space-y-3">
              {#each soal.pilihan as pilihan (pilihan.id)}
                <label class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 transition-colors" class:ring-2={jawaban.get(soal.id) === pilihan.id} class:ring-primary={jawaban.get(soal.id) === pilihan.id}>
                  <input type="radio" name="soal-{soal.id}" value={pilihan.id} checked={jawaban.get(soal.id) === pilihan.id} onchange={() => handleSelectJawaban(soal.id, pilihan.id)} class="h-4 w-4" />
                  <span class="flex-1 text-gray-900">{pilihan.teks}</span>
                </label>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <div class="mt-8 flex gap-3">
        <button onclick={handleSubmit} disabled={loading || jawaban.size < data.soal.length} class="flex-1 rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary-hover disabled:opacity-50">
          {loading ? 'Mengirim...' : 'Selesai & Kirim'}
        </button>
        <button onclick={() => goto(kembaliUrl)} class="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50">Batal</button>
      </div>
    {/if}
  </div>
</div>
