<script lang="ts">
  import { page } from '$app/state'
  import { SvelteMap, SvelteSet } from 'svelte/reactivity'
  import { startLatihan as apiStartLatihan, saveJawaban, submitAttempt } from '$features/question/data/attempt'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import ProgressBar from '$lib/components/ProgressBar.svelte'
  import { RotateCcw } from 'lucide-svelte'

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
  // Soal whose answer never reached the server — marked in the UI.
  let gagalSimpan = new SvelteSet<string>()
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
      gagalSimpan.delete(soalId)
      message = 'Jawaban disimpan'
      setTimeout(() => (message = ''), 2000)
    } catch (err) {
      // A silently dropped answer is graded as blank, so it has to be visible.
      gagalSimpan.add(soalId)
      error = 'Sebagian jawaban gagal tersimpan. Periksa koneksi lalu pilih ulang jawaban tersebut.'
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

<svelte:head>
  <title>Latihan: {data.subMateri.nama} · Pena</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
  <div class="mb-6">
    <a href={kembaliUrl} class="text-sm font-medium text-primary hover:underline">← Kembali</a>
    <h1 class="mt-4 font-serif text-2xl text-foreground">Latihan: {data.subMateri.nama}</h1>
  </div>

  {#if !attemptId}
    <Card class="p-8 text-center">
      {#if data.soal.length === 0}
        <p class="text-sm text-muted-foreground">Belum ada soal latihan untuk topik ini.</p>
      {:else}
        <h2 class="mb-4 font-serif text-xl text-foreground">Siap Memulai?</h2>
        <p class="mb-6 text-sm text-muted-foreground">
          Latihan soal ini terdiri dari
          <strong class="font-mono text-foreground">{data.soal.length}</strong> soal. Anda bisa
          mengulang latihan ini berkali-kali.
        </p>
        <Button onclick={startLatihan} disabled={loading}>
          {loading ? 'Memulai...' : 'Mulai Latihan'}
        </Button>
      {/if}
    </Card>
  {:else if submitted}
    <Card class="p-8 text-center">
      <h2 class="font-serif text-2xl text-foreground">Selesai!</h2>
      <p class="mt-4 font-mono text-5xl text-foreground">{nilai}</p>
      <p class="mt-2 text-sm text-muted-foreground">dari <span class="font-mono">100</span></p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <Button onclick={handleRetry}>
          <RotateCcw class="mr-2 h-4 w-4" />
          Ulangi Latihan
        </Button>
        <Button variant="secondary" href={kembaliUrl}>Kembali</Button>
      </div>
    </Card>
  {:else}
    {#if error}
      <div class="mb-4 rounded-lg bg-red-100 p-4"><p class="text-sm text-red-800">{error}</p></div>
    {/if}
    {#if message}
      <div class="mb-4 rounded-lg bg-emerald-100 p-4">
        <p class="text-sm text-emerald-800">✓ {message}</p>
      </div>
    {/if}

    <!-- Hitungan terjawab ikut menempel saat scroll: di HP daftar soalnya jauh
         lebih panjang dari satu layar. -->
    <div class="sticky top-14 z-20 mb-6 rounded-xl border border-border bg-card p-4 lg:top-0">
      <div class="flex items-center justify-between gap-4">
        <span class="text-sm font-medium text-foreground">
          <span class="font-mono">{jawaban.size}</span> dari
          <span class="font-mono">{data.soal.length}</span> terjawab
        </span>
        <ProgressBar
          value={(jawaban.size / data.soal.length) * 100}
          showLabel={false}
          class="w-32"
        />
      </div>
    </div>

    <div class="space-y-6">
      {#each data.soal as soal (soal.id)}
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
      {/each}
    </div>

    <div class="mt-8 flex flex-wrap gap-3">
      <Button
        onclick={handleSubmit}
        disabled={loading || jawaban.size < data.soal.length}
        class="flex-1"
      >
        {loading ? 'Mengirim...' : 'Selesai & Kirim'}
      </Button>
      <Button variant="secondary" href={kembaliUrl}>Batal</Button>
    </div>
  {/if}
</div>
