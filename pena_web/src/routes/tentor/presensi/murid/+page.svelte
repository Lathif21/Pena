<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { SvelteMap } from 'svelte/reactivity'
  import { savePresensi } from '$features/attendance/data/presensi-murid'
  import Badge from '$lib/components/Badge.svelte'
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import { CalendarX } from 'lucide-svelte'

  let { data } = $props()

  // SvelteMap, bukan Map: $state tidak membuat koleksi bawaan reaktif, jadi
  // mutasi Map biasa tidak pernah merender ulang centang atau hitungan hadir.
  let hadir = new SvelteMap<string, boolean>(
    data.siswa.map((s) => [s.siswa_detail_id, data.tersimpan[s.siswa_detail_id] ?? true])
  )
  let loading = $state(false)
  let error = $state('')
  let message = $state('')

  let jumlahHadir = $derived([...hadir.values()].filter(Boolean).length)

  async function simpan() {
    if (!data.sesiAktif) return
    loading = true
    error = ''
    message = ''
    try {
      const hasil = await savePresensi(
        data.sesiAktif.id,
        data.siswa.map((s) => ({
          siswaDetailId: s.siswa_detail_id,
          isHadir: hadir.get(s.siswa_detail_id) ?? true
        }))
      )
      message = `Presensi tersimpan untuk ${hasil.saved} siswa`
      await invalidateAll()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal menyimpan presensi'
    } finally {
      loading = false
    }
  }
</script>

<div class="mx-auto max-w-3xl">
  <h1 class="font-serif text-2xl text-foreground">Presensi Murid</h1>

  {#if !data.sesiAktif}
    <Card class="mt-6 p-8 text-center">
      <CalendarX class="mx-auto h-8 w-8 text-muted-foreground" />
      <p class="mt-2 font-medium text-foreground">Submit presensi diri dulu</p>
      <p class="mt-2 text-sm text-muted-foreground">
        Presensi murid baru terbuka setelah Anda mengunggah foto presensi dan sesi dimulai.
      </p>
      <Button href="/tentor/presensi/diri" class="mt-4">Ke Presensi Diri</Button>
    </Card>
  {:else}
    <p class="mt-1 text-sm text-muted-foreground">
      {data.sesiAktif.kelasNama} · {data.sesiAktif.mapelNama}
    </p>

    {#if error}
      <div class="mt-4 rounded-lg bg-red-100 p-4"><p class="text-sm text-red-800">{error}</p></div>
    {/if}
    {#if message}
      <div class="mt-4 rounded-lg bg-emerald-100 p-4">
        <p class="text-sm text-emerald-800">✓ {message}</p>
      </div>
    {/if}

    <Card class="mt-6">
      {#if data.siswa.length === 0}
        <p class="text-center text-sm text-muted-foreground">
          Belum ada siswa reguler terdaftar di kelas ini. Siswa privat memang tidak pernah muncul di
          presensi.
        </p>
      {:else}
        <div class="mb-4 flex items-baseline justify-between gap-3">
          <h2 class="font-serif text-base text-foreground">
            Daftar Siswa (<span class="font-mono">{data.siswa.length}</span>)
          </h2>
          <span class="text-sm text-muted-foreground">
            <span class="font-mono">{jumlahHadir}</span> hadir
          </span>
        </div>

        <div class="divide-y divide-border">
          {#each data.siswa as s (s.siswa_detail_id)}
            {@const ini = hadir.get(s.siswa_detail_id) ?? true}
            <!-- Seluruh baris jadi target sentuh; py-3 + tinggi isi sudah lewat 44px. -->
            <label class="flex cursor-pointer items-center gap-3 py-3 hover:bg-muted/30">
              <input
                type="checkbox"
                checked={ini}
                onchange={(e) => hadir.set(s.siswa_detail_id, e.currentTarget.checked)}
                class="h-5 w-5 shrink-0 rounded border-border accent-primary"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-foreground">{s.nama_lengkap}</span>
                <span class="block font-mono text-xs text-muted-foreground">{s.nis}</span>
              </span>
              <Badge tone={ini ? 'success' : 'error'}>{ini ? 'Hadir' : 'Tidak hadir'}</Badge>
            </label>
          {/each}
        </div>

        <Button onclick={simpan} disabled={loading} class="mt-6 w-full">
          {loading ? 'Menyimpan...' : 'Simpan Presensi'}
        </Button>
        <p class="mt-2 text-center text-xs text-muted-foreground">
          Masih bisa dikoreksi selama sesi belum diselesaikan.
        </p>
      {/if}
    </Card>
  {/if}
</div>
