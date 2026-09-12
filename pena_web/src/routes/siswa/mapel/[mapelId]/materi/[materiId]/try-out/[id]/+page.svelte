<script lang="ts">
  import { browser } from '$app/environment'
  import { startTryOut as apiStartTryOut, saveJawaban, submitAttempt } from '$features/question/data/attempt'
  import { onMount } from 'svelte'
  import { SvelteMap, SvelteSet } from 'svelte/reactivity'
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import ProgressBar from '$lib/components/ProgressBar.svelte'
  import { Lock } from 'lucide-svelte'

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
  let timerColor = $state('text-muted-foreground')

  // Di bawah md satu soal per layar; di desktop seluruh set boleh menggulung.
  // Dipakai satu daftar soal saja, bukan dua yang saling sembunyi: dua <input
  // radio> dengan name sama akan saling membatalkan centang meski salah satunya
  // tersembunyi CSS.
  const KUERI_DESKTOP = '(min-width: 768px)'
  let desktop = $state(browser ? window.matchMedia(KUERI_DESKTOP).matches : true)
  let indeks = $state(0)

  onMount(() => {
    const mq = window.matchMedia(KUERI_DESKTOP)
    const ikuti = (e: MediaQueryListEvent) => (desktop = e.matches)
    mq.addEventListener('change', ikuti)
    return () => mq.removeEventListener('change', ikuti)
  })

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
    if (timeRemaining > 300) timerColor = 'text-muted-foreground'
    else if (timeRemaining > 60) timerColor = 'text-amber-800'
    else timerColor = 'text-red-800'
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

<div class="mx-auto max-w-4xl">
  {#if data.status === 'belum_buka'}
    <Card class="p-8 text-center">
      <Lock class="mx-auto h-8 w-8 text-muted-foreground" />
      <h2 class="mt-4 font-serif text-2xl text-foreground">{data.tryOut.judul}</h2>
      <p class="mt-2 text-sm text-muted-foreground">Try out ini belum dibuka.</p>
      <dl class="mx-auto mt-6 max-w-sm rounded-lg bg-muted/30 p-4 text-left text-sm">
        <div class="flex justify-between gap-3 py-1">
          <dt class="text-muted-foreground">Dibuka</dt>
          <dd class="font-mono text-foreground">
            {new Date(data.tryOut.waktuBuka).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
          </dd>
        </div>
        <div class="flex justify-between gap-3 py-1">
          <dt class="text-muted-foreground">Durasi</dt>
          <dd class="font-mono text-foreground">{data.tryOut.durasi_menit} menit</dd>
        </div>
      </dl>
      <p class="mt-4 text-xs text-muted-foreground">Soal baru bisa dilihat setelah waktu buka.</p>
      <Button variant="secondary" href="/siswa/mapel" class="mt-6">Kembali ke Mata Pelajaran</Button>
    </Card>
  {:else if data.status === 'terlewat'}
    <Card class="p-8 text-center">
      <h2 class="font-serif text-2xl text-foreground">{data.tryOut.judul}</h2>
      <p class="mt-2 text-sm text-muted-foreground">
        Waktu try out sudah berakhir dan Anda tidak mengerjakannya.
      </p>
      <p class="mt-4 text-sm text-muted-foreground">Nilai</p>
      <p class="font-mono text-4xl text-destructive">0</p>
      <Button variant="secondary" href="/siswa/mapel" class="mt-6">Kembali ke Mata Pelajaran</Button>
    </Card>
  {:else if !attemptId}
    <Card class="p-8 text-center">
      <h2 class="font-serif text-2xl text-foreground">{data.tryOut.judul}</h2>
      <p class="mt-2 text-sm text-muted-foreground">
        <span class="font-mono">{data.tryOut.durasi_menit}</span> menit ·
        <span class="font-mono">{data.soal.length}</span> soal
      </p>
      <div class="mt-8 space-y-3 rounded-lg bg-amber-100 p-4 text-left">
        <p class="font-medium text-amber-800">Perhatian:</p>
        <ul class="space-y-1 text-sm text-amber-800">
          <li>• Try out ini hanya bisa dikerjakan SATU KALI</li>
          <li>• Timer akan berjalan otomatis</li>
          <li>• Jawaban disimpan secara otomatis</li>
          <li>• Jika waktu habis, pekerjaan otomatis dikirim</li>
          <li>• Jangan menutup browser di tengah pengerjaan</li>
        </ul>
      </div>
      <Button onclick={startTryOut} disabled={loading} class="mt-8">
        {loading ? 'Memulai...' : 'Mulai Try Out'}
      </Button>
    </Card>
  {:else if submitted}
    <div class="space-y-6">
      <Card class="p-8 text-center">
        <h2 class="font-serif text-2xl text-foreground">Selesai!</h2>
        <p class="mt-4 font-mono text-5xl text-foreground">{nilai}</p>
        <p class="mt-2 text-sm text-muted-foreground">dari <span class="font-mono">100</span></p>
        <Button href="/siswa/mapel" class="mt-6">Kembali ke Mata Pelajaran</Button>
      </Card>

      {#if data.review}
        <div>
          <h3 class="mb-4 font-serif text-lg text-foreground">Review Jawaban</h3>
          <div class="space-y-6">
            {#each data.soal as soal (soal.id)}
              {@const kunci = data.review.kunciPerSoal[soal.id]}
              {@const dijawab = data.review.jawabanPerSoal[soal.id]}
              <Card>
                <div class="mb-4 flex items-start justify-between gap-4">
                  <h4 class="font-serif text-base text-foreground">
                    Soal <span class="font-mono">{soal.nomor_urut}</span>
                  </h4>
                  {#if dijawab === kunci}
                    <Badge tone="success">Benar</Badge>
                  {:else if dijawab}
                    <Badge tone="error">Salah</Badge>
                  {:else}
                    <span
                      class="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      Tidak dijawab
                    </span>
                  {/if}
                </div>
                <p class="mb-4 text-foreground">{soal.pertanyaan}</p>
                <div class="space-y-2">
                  {#each soal.pilihan as pilihan (pilihan.id)}
                    <div
                      class="flex items-center gap-3 rounded-lg border p-3 text-sm {pilihan.id === kunci
                        ? 'border-emerald-300 bg-emerald-100'
                        : pilihan.id === dijawab
                          ? 'border-red-300 bg-red-100'
                          : 'border-border'}"
                    >
                      <span class="flex-1 text-foreground">{pilihan.teks}</span>
                      {#if pilihan.id === kunci}
                        <span class="text-xs font-medium text-emerald-800">Jawaban benar</span>
                      {:else if pilihan.id === dijawab}
                        <span class="text-xs font-medium text-red-800">Jawaban Anda</span>
                      {/if}
                    </div>
                  {/each}
                </div>
              </Card>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Timer dan hitungan terjawab tetap terlihat saat menggulung. top-14 di HP
         supaya duduk di bawah top bar AppShell, bukan menimpanya. -->
    <div class="sticky top-14 z-20 mb-6 rounded-xl border border-border bg-card p-4 lg:top-0">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="truncate font-serif text-base text-foreground">{data.tryOut.judul}</h1>
          <p class="text-xs text-muted-foreground">
            <span class="font-mono">{jawaban.size}</span> dari
            <span class="font-mono">{data.soal.length}</span> terjawab
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs text-muted-foreground">Sisa Waktu</p>
          <p class="font-mono text-2xl {timerColor}">{formatTime(timeRemaining)}</p>
        </div>
      </div>
      <ProgressBar
        value={(jawaban.size / data.soal.length) * 100}
        showLabel={false}
        class="mt-3"
      />
    </div>

    {#if error}
      <div class="mb-4 rounded-lg bg-red-100 p-4"><p class="text-sm text-red-800">{error}</p></div>
    {/if}

    <div class="space-y-6">
      {#each data.soal as soal, i (soal.id)}
        {#if desktop || i === indeks}
          <Card>
            <h3 class="mb-4 font-serif text-lg text-foreground">
              Soal <span class="font-mono">{soal.nomor_urut}</span>
            </h3>
            <p class="mb-6 text-foreground">{soal.pertanyaan}</p>
            <div class="space-y-3">
              {#each soal.pilihan as pilihan (pilihan.id)}
                {@const dipilih = jawaban.get(soal.id) === pilihan.id}
                <label
                  class="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 {dipilih
                    ? 'border-primary bg-secondary'
                    : 'border-border'}"
                >
                  <input
                    type="radio"
                    name="soal-{soal.id}"
                    value={pilihan.id}
                    checked={dipilih}
                    onchange={() => handleSelectJawaban(soal.id, pilihan.id)}
                    class="h-5 w-5 shrink-0 accent-primary"
                  />
                  <span class="flex-1 text-foreground">{pilihan.teks}</span>
                  {#if gagalSimpan.has(soal.id) && dipilih}
                    <span class="text-xs font-medium text-destructive">belum tersimpan</span>
                  {/if}
                </label>
              {/each}
            </div>
          </Card>
        {/if}
      {/each}
    </div>

    {#if desktop}
      <div class="mt-8">
        <Button onclick={() => handleSubmit(false)} disabled={loading} class="w-full">
          {loading ? 'Mengirim...' : 'Selesai & Kirim'}
        </Button>
      </div>
    {:else}
      <!-- Bar bawah menempel: tombol kirim tidak boleh tergulung keluar layar. -->
      <div
        class="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-border bg-card p-4"
      >
        <div class="flex items-center gap-3">
          <Button
            variant="secondary"
            onclick={() => (indeks = Math.max(0, indeks - 1))}
            disabled={indeks === 0}
          >
            ←
          </Button>
          <span class="font-mono text-sm text-muted-foreground">
            {indeks + 1}/{data.soal.length}
          </span>
          {#if indeks < data.soal.length - 1}
            <Button
              onclick={() => (indeks = Math.min(data.soal.length - 1, indeks + 1))}
              class="flex-1"
            >
              Lanjut →
            </Button>
          {:else}
            <Button onclick={() => handleSubmit(false)} disabled={loading} class="flex-1">
              {loading ? 'Mengirim...' : 'Selesai & Kirim'}
            </Button>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>
