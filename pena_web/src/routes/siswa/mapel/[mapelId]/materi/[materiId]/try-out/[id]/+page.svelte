<script lang="ts">
  import { goto } from '$app/navigation'
  import { startTryOut as apiStartTryOut, saveJawaban, submitAttempt } from '$features/question/data/attempt'
  import { onMount } from 'svelte'
  import { SvelteMap, SvelteSet } from 'svelte/reactivity'

  let { data } = $props()

  let attemptId = $state(data.attempt?.id || '')
  // SvelteMap, not Map: $state does not make built-in collections reactive, so
  // mutating a plain Map never re-renders the answer count or the selected radio.
  let jawaban = new SvelteMap<string, string>()
  let submitted = $state(!!data.attempt?.submitted_at)
  let nilai = $state(data.attempt?.nilai || 0)
  let loading = $state(false)
  let error = $state('')
  // Soal whose answer never reached the server — marked in the UI.
  let gagalSimpan = new SvelteSet<string>()
  let timeRemaining = $state(data.tryOut.durasi_menit * 60)
  let timerColor = $state('text-gray-600')

  onMount(() => {
    if (attemptId && !submitted) {
      const now = Date.now()
      const timeUsed = (now - new Date(data.attempt.started_at).getTime()) / 1000
      timeRemaining = Math.max(0, Math.ceil(data.tryOut.durasi_menit * 60 - timeUsed))

      const timerInterval = setInterval(() => {
        timeRemaining -= 1
        updateTimerColor()
        if (timeRemaining <= 0) {
          clearInterval(timerInterval)
          autoSubmit()
        }
      }, 1000)

      return () => clearInterval(timerInterval)
    }
  })

  function updateTimerColor() {
    if (timeRemaining > 300) timerColor = 'text-gray-600'
    else if (timeRemaining > 60) timerColor = 'text-amber-600'
    else timerColor = 'text-red-600'
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  async function startTryOut() {
    if (!data.siswaDetailId) { error = 'Siswa tidak ditemukan'; return }
    loading = true; error = ''
    try {
      const attempt = await apiStartTryOut(data.tryOut.id)
      attemptId = attempt.id; jawaban.clear(); submitted = false; nilai = 0; timeRemaining = data.tryOut.durasi_menit * 60
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal memulai try out'
    } finally {
      loading = false
    }
  }

  async function handleSelectJawaban(soalId: string, pilihanId: string) {
    jawaban.set(soalId, pilihanId)
    if (!attemptId) return
    try {
      await saveJawaban(attemptId, soalId, pilihanId)
      gagalSimpan.delete(soalId)
    } catch (err) {
      // A silently dropped answer is graded as blank, so it has to be visible.
      gagalSimpan.add(soalId)
      error = 'Sebagian jawaban gagal tersimpan. Periksa koneksi lalu pilih ulang jawaban tersebut.'
      console.error('Error saving jawaban:', err)
    }
  }

  async function autoSubmit() {
    if (!attemptId || submitted) return
    await handleSubmit(true)
  }

  async function handleSubmit(isAuto = false) {
    if (!attemptId) return
    loading = true; error = ''
    try {
      const score = await submitAttempt(attemptId)
      nilai = score; submitted = true
      if (isAuto) error = 'Waktu habis! Pekerjaan Anda telah dikirim secara otomatis.'
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal submit try out'
    } finally {
      loading = false
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-4xl px-4 py-8">
    {#if data.status === 'belum_buka'}
      <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <div class="text-4xl">🔒</div>
        <h2 class="mt-4 text-2xl font-bold text-gray-900">{data.tryOut.judul}</h2>
        <p class="mt-2 text-gray-600">Try out ini belum dibuka.</p>
        <div class="mx-auto mt-6 max-w-sm rounded-lg bg-gray-50 p-4 text-left text-sm">
          <div class="flex justify-between py-1">
            <span class="text-gray-500">Dibuka</span>
            <span class="font-medium text-gray-900">
              {new Date(data.tryOut.waktuBuka).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
            </span>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-gray-500">Durasi</span>
            <span class="font-medium text-gray-900">{data.tryOut.durasi_menit} menit</span>
          </div>
        </div>
        <p class="mt-4 text-xs text-gray-500">Soal baru bisa dilihat setelah waktu buka.</p>
        <button onclick={() => goto('/siswa/dashboard')} class="mt-6 rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50">
          Kembali ke Dashboard
        </button>
      </div>
    {:else if data.status === 'terlewat'}
      <div class="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <h2 class="text-2xl font-bold text-red-800">{data.tryOut.judul}</h2>
        <p class="mt-2 text-red-700">Waktu try out sudah berakhir dan Anda tidak mengerjakannya.</p>
        <p class="mt-4 text-sm text-red-700">Nilai: <span class="text-2xl font-bold">0</span></p>
        <button onclick={() => goto('/siswa/dashboard')} class="mt-6 rounded-lg border border-red-300 bg-white px-6 py-3 text-red-700 hover:bg-red-100">
          Kembali ke Dashboard
        </button>
      </div>
    {:else if !attemptId}
      <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <h2 class="mb-2 text-2xl font-bold text-gray-900">{data.tryOut.judul}</h2>
        <p class="mb-6 text-gray-600">{data.tryOut.durasi_menit} menit • {data.soal.length} soal</p>
        <div class="mb-8 space-y-3 rounded-lg bg-amber-50 p-4 text-left">
          <p class="font-medium text-amber-900">⚠️ Perhatian:</p>
          <ul class="space-y-1 text-sm text-amber-800">
            <li>• Try out ini hanya bisa dikerjakan SATU KALI</li>
            <li>• Timer akan berjalan otomatis</li>
            <li>• Jawaban disimpan secara otomatis</li>
            <li>• Jika waktu habis, pekerjaan otomatis dikirim</li>
            <li>• Jangan menutup browser di tengah pengerjaan</li>
          </ul>
        </div>
        <button onclick={startTryOut} disabled={loading} class="rounded-lg bg-primary px-8 py-3 text-white hover:bg-primary-hover disabled:opacity-50">
          {loading ? 'Memulai...' : 'Mulai Try Out'}
        </button>
      </div>
    {:else if submitted}
      <div class="space-y-6">
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <h2 class="mb-2 text-2xl font-bold text-emerald-700">Selesai!</h2>
          <div class="mb-6">
            <div class="text-5xl font-bold text-emerald-600">{nilai}</div>
            <p class="mt-2 text-emerald-700">dari 100</p>
          </div>
          <button onclick={() => goto('/siswa/dashboard')} class="rounded-lg bg-emerald-600 px-6 py-3 text-white hover:bg-emerald-700">
            Kembali ke Dashboard
          </button>
        </div>

        {#if data.review}
          <div>
            <h3 class="mb-4 text-lg font-semibold text-gray-900">Review Jawaban</h3>
            <div class="space-y-6">
              {#each data.soal as soal (soal.id)}
                {@const kunci = data.review.kunciPerSoal[soal.id]}
                {@const dijawab = data.review.jawabanPerSoal[soal.id]}
                <div class="rounded-2xl border border-gray-200 bg-white p-6">
                  <div class="mb-4 flex items-start justify-between gap-4">
                    <h4 class="text-base font-semibold text-gray-900">Soal {soal.nomor_urut}</h4>
                    {#if dijawab === kunci}
                      <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Benar</span>
                    {:else if dijawab}
                      <span class="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">Salah</span>
                    {:else}
                      <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">Tidak dijawab</span>
                    {/if}
                  </div>
                  <p class="mb-4 text-gray-900">{soal.pertanyaan}</p>
                  <div class="space-y-2">
                    {#each soal.pilihan as pilihan (pilihan.id)}
                      <div
                        class="flex items-center gap-3 rounded-lg border p-3 text-sm"
                        class:border-emerald-300={pilihan.id === kunci}
                        class:bg-emerald-50={pilihan.id === kunci}
                        class:border-red-300={pilihan.id === dijawab && dijawab !== kunci}
                        class:bg-red-50={pilihan.id === dijawab && dijawab !== kunci}
                        class:border-gray-200={pilihan.id !== kunci && pilihan.id !== dijawab}
                      >
                        <span class="flex-1 text-gray-900">{pilihan.teks}</span>
                  {#if gagalSimpan.has(soal.id) && jawaban.get(soal.id) === pilihan.id}
                    <span class="text-xs font-medium text-danger">belum tersimpan</span>
                  {/if}
                        {#if pilihan.id === kunci}
                          <span class="text-xs font-medium text-emerald-700">Jawaban benar</span>
                        {:else if pilihan.id === dijawab}
                          <span class="text-xs font-medium text-red-700">Jawaban Anda</span>
                        {/if}
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="mb-6 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
        <h1 class="text-xl font-bold text-gray-900">{data.tryOut.judul}</h1>
        <div class="text-right">
          <p class="text-xs text-gray-500 mb-1">Sisa Waktu</p>
          <div class={`text-3xl font-bold font-mono ${timerColor}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      {#if error}
        <div class="mb-4 rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-800">{error}</p>
        </div>
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
        <button onclick={() => handleSubmit(false)} disabled={loading} class="flex-1 rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary-hover disabled:opacity-50">
          {loading ? 'Mengirim...' : 'Selesai & Kirim'}
        </button>
      </div>
    {/if}
  </div>
</div>
