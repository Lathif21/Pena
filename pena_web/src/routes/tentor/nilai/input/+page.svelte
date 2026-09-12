<script lang="ts">
  import { goto } from '$app/navigation'
  import { SvelteMap } from 'svelte/reactivity'
  import { createNilaiManual } from '$features/grading/data/nilai-manual'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import Table from '$lib/components/Table.svelte'
  import Th from '$lib/components/Th.svelte'
  import Td from '$lib/components/Td.svelte'

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

  const gayaField =
    'mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none'
  const gayaKecil =
    'rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none'

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

  let terisi = $derived([...nilaiInput.values()].filter((v) => v.nilai !== null).length)

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
  <div class="mb-6">
    <a href="/tentor/nilai" class="text-sm font-medium text-primary hover:underline">← Kembali</a>
    <h1 class="mt-4 font-serif text-2xl text-foreground">Input Nilai Manual</h1>
    <p class="mt-1 text-sm text-muted-foreground">Masukkan nilai dari ujian atau tugas tertulis</p>
  </div>

  {#if error}
    <div class="mb-4 rounded-lg bg-red-100 p-4"><p class="text-sm text-red-800">{error}</p></div>
  {/if}
  {#if message}
    <div class="mb-4 rounded-lg bg-emerald-100 p-4">
      <p class="text-sm text-emerald-800">✓ {message}</p>
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-6">
    <Card>
      <h2 class="mb-4 font-serif text-lg text-foreground">Pilih Mapel & Tipe Test</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label for="mapel" class="block text-sm font-medium text-foreground">Mata Pelajaran</label>
          <select
            id="mapel"
            value={data.mapelId}
            onchange={(e) => pilihMapel((e.currentTarget as HTMLSelectElement).value)}
            class="{gayaField} pr-8"
          >
            <option value="">Pilih Mapel...</option>
            {#each data.mapel as m (m.id)}
              <option value={m.id}>{m.nama}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="tipeTest" class="block text-sm font-medium text-foreground">Tipe Test</label>
          <select id="tipeTest" bind:value={tipeTest} class="{gayaField} pr-8">
            <option value="pre_test">Pre-Test</option>
            <option value="try_out">Try Out</option>
            <option value="post_test">Post-Test</option>
          </select>
        </div>
        <div>
          <label for="tanggal" class="block text-sm font-medium text-foreground">Tanggal</label>
          <input id="tanggal" type="date" bind:value={tanggal} class={gayaField} />
        </div>
      </div>
      <div class="mt-4">
        <label for="judul" class="block text-sm font-medium text-foreground">Judul / Deskripsi</label>
        <input
          id="judul"
          type="text"
          bind:value={judul}
          placeholder="Contoh: Ulangan Harian Bab 1"
          class={gayaField}
        />
      </div>
    </Card>

    {#if data.mapelId}
      <Card>
        <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="font-serif text-lg text-foreground">
            Daftar Siswa (<span class="font-mono">{data.siswa.length}</span>)
          </h2>
          <p class="text-xs text-muted-foreground">
            Hanya siswa dari kelas yang Anda ajar · nilai 0–<span class="font-mono">{NILAI_MAX}</span>
          </p>
        </div>

        {#if data.siswa.length === 0}
          <p class="text-sm text-muted-foreground">Tidak ada siswa yang Anda ajar untuk mapel ini.</p>
        {:else}
          <!-- Empat kolom dengan input angka di dalamnya — di bawah md wajib jadi
               card, kalau tidak kolom nilainya terdorong keluar layar. -->
          <div class="space-y-3 md:hidden">
            {#each data.siswa as siswa (siswa.siswa_detail_id)}
              {@const current = nilaiInput.get(siswa.siswa_detail_id) ?? { nilai: null, catatan: '' }}
              <div class="rounded-lg border border-border p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-foreground">{siswa.nama_lengkap}</p>
                    <p class="font-mono text-xs text-muted-foreground">{siswa.nis}</p>
                  </div>
                  <span class="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                    {siswa.kelas}
                  </span>
                </div>
                <div class="mt-3 grid gap-3">
                  <div>
                    <label
                      for="nilai-{siswa.siswa_detail_id}"
                      class="block text-xs font-medium text-muted-foreground"
                    >
                      Nilai
                    </label>
                    <input
                      id="nilai-{siswa.siswa_detail_id}"
                      type="number"
                      min="0"
                      max={NILAI_MAX}
                      step="1"
                      value={current.nilai ?? ''}
                      oninput={(e) => setNilai(siswa.siswa_detail_id, e.currentTarget.value, current.catatan)}
                      placeholder="—"
                      class="{gayaKecil} mt-1 w-full font-mono"
                    />
                  </div>
                  <div>
                    <label
                      for="catatan-{siswa.siswa_detail_id}"
                      class="block text-xs font-medium text-muted-foreground"
                    >
                      Catatan (opsional)
                    </label>
                    <input
                      id="catatan-{siswa.siswa_detail_id}"
                      type="text"
                      value={current.catatan}
                      oninput={(e) => setCatatan(siswa.siswa_detail_id, e.currentTarget.value)}
                      placeholder="Catatan..."
                      class="{gayaKecil} mt-1 w-full"
                    />
                  </div>
                </div>
              </div>
            {/each}
          </div>

          <div class="hidden md:block">
            <Table>
              {#snippet head()}
                <Th>Nama Siswa</Th>
                <Th>Kelas</Th>
                <Th>Nilai</Th>
                <Th>Catatan (Opsional)</Th>
              {/snippet}
              {#snippet body()}
                {#each data.siswa as siswa (siswa.siswa_detail_id)}
                  {@const current = nilaiInput.get(siswa.siswa_detail_id) ?? { nilai: null, catatan: '' }}
                  <tr class="border-b border-border hover:bg-muted/30">
                    <Td>
                      <span class="block text-foreground">{siswa.nama_lengkap}</span>
                      <span class="font-mono text-xs text-muted-foreground">{siswa.nis}</span>
                    </Td>
                    <Td>
                      <span class="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                        {siswa.kelas}
                      </span>
                    </Td>
                    <Td>
                      <input
                        type="number"
                        min="0"
                        max={NILAI_MAX}
                        step="1"
                        aria-label="Nilai {siswa.nama_lengkap}"
                        value={current.nilai ?? ''}
                        oninput={(e) => setNilai(siswa.siswa_detail_id, e.currentTarget.value, current.catatan)}
                        placeholder="—"
                        class="{gayaKecil} w-24 text-center font-mono"
                      />
                    </Td>
                    <Td>
                      <input
                        type="text"
                        aria-label="Catatan {siswa.nama_lengkap}"
                        value={current.catatan}
                        oninput={(e) => setCatatan(siswa.siswa_detail_id, e.currentTarget.value)}
                        placeholder="Catatan..."
                        class="{gayaKecil} w-full"
                      />
                    </Td>
                  </tr>
                {/each}
              {/snippet}
            </Table>
          </div>
        {/if}
      </Card>
    {/if}

    <div class="flex flex-wrap gap-3">
      <Button
        type="submit"
        disabled={submitting || !data.mapelId || data.siswa.length === 0 || terisi === 0}
      >
        {submitting ? 'Menyimpan...' : `Simpan Nilai (${terisi})`}
      </Button>
      <Button variant="secondary" href="/tentor/nilai">Batal</Button>
    </div>
  </form>
</div>
