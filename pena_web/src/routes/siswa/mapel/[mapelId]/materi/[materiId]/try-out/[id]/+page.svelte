<script lang="ts">
  import { goto } from '$app/navigation'
  import { startAttempt, saveJawaban, submitAttempt } from '$features/question/data/attempt'
  import { onMount } from 'svelte'

  let { data } = $props()

  let attemptId = $state(data.attempt?.id || '')
  let jawaban = $state<Map<string, string>>(new Map())
  let submitted = $state(!!data.attempt?.submitted_at)
  let nilai = $state(data.attempt?.nilai || 0)
  let loading = $state(false)
  let error = $state('')
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
      const attempt = await startAttempt(data.siswaDetailId, data.tryOut.id, true, data.user.tahun_ajaran_id)
      attemptId = attempt.id; jawaban = new Map(); submitted = false; nilai = 0; timeRemaining = data.tryOut.durasi_menit * 60
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal memulai try out'
    } finally {
      loading = false
    }
  }

  async function handleSelectJawaban(soalId: string, pilihanId: string) {
    jawaban.set(soalId, pilihanId); jawaban = jawaban
    if (!attemptId) return
    try {
      await saveJawaban(attemptId, soalId, pilihanId)
    } catch (err) {
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
    {#if !attemptId}
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
          <button onclick={() => goto('/siswa')} class="rounded-lg bg-emerald-600 px-6 py-3 text-white hover:bg-emerald-700">
            Kembali ke Dashboard
          </button>
        </div>
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
