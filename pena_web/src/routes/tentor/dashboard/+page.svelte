<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation'
  import { enhance } from '$app/forms'
  import { closeSesi } from '$features/session/data/close-sesi'

  let { data } = $props()

  let menutup = $state(false)
  let konfirmasi = $state(false)
  let error = $state('')

  let sapaan = $derived.by(() => {
    const jam = new Date().getHours()
    if (jam < 11) return 'Selamat pagi'
    if (jam < 15) return 'Selamat siang'
    if (jam < 18) return 'Selamat sore'
    return 'Selamat malam'
  })

  const menu = [
    { label: 'Presensi Diri', ikon: '📸', href: '/tentor/presensi/diri' },
    { label: 'Presensi Murid', ikon: '✅', href: '/tentor/presensi/murid' },
    { label: 'Jurnal Mengajar', ikon: '📓', href: '/tentor/jurnal' },
    { label: 'Input Nilai', ikon: '📝', href: '/tentor/nilai' },
    { label: 'Lihat Modul', ikon: '📖', href: '/tentor/modul' }
  ]

  async function selesaikan() {
    if (!data.sesiAktif) return
    menutup = true
    error = ''
    try {
      await closeSesi(data.sesiAktif.id)
      konfirmasi = false
      await invalidateAll()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Gagal menyelesaikan sesi'
      konfirmasi = false
    } finally {
      menutup = false
    }
  }

  function jam(iso: string) {
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{sapaan}, {data.user.nama_lengkap}</h1>
        <p class="mt-1 text-sm text-gray-500">Dashboard Tentor</p>
      </div>
      <form method="POST" action="?/logout" use:enhance>
        <button type="submit" class="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-destructive hover:bg-red-50">
          Logout
        </button>
      </form>
    </div>

    {#if error}
      <div class="mb-4 rounded-md bg-red-50 p-4"><p class="text-sm text-red-800">{error}</p></div>
    {/if}

    <!-- Status sesi hari ini -->
    {#if data.sesiAktif}
      <div class="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span class="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Sedang berjalan
            </span>
            <h2 class="mt-2 text-base font-semibold text-gray-900">
              {data.sesiAktif.kelasNama} · {data.sesiAktif.mapelNama}
            </h2>
            <p class="mt-1 text-xs text-gray-500">Dimulai {jam(data.sesiAktif.startedAt)}</p>
          </div>
          <button
            onclick={() => (konfirmasi = true)}
            disabled={!data.sesiAktif.adaJurnal || menutup}
            class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            Selesai Mengajar
          </button>
        </div>
        {#if !data.sesiAktif.adaJurnal}
          <p class="mt-3 text-sm text-amber-800">
            Isi <a href="/tentor/jurnal" class="font-medium underline">jurnal mengajar</a> dulu sebelum menyelesaikan sesi.
          </p>
        {/if}
      </div>
    {:else}
      <div class="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 class="text-base font-semibold text-gray-900">Belum ada sesi berjalan</h2>
        <p class="mt-1 text-sm text-gray-500">
          Mulai dengan mengunggah foto presensi diri — itu yang membuka sesi.
        </p>
        <button onclick={() => goto('/tentor/presensi/diri')} class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          Mulai Sesi
        </button>
      </div>
    {/if}

    {#if data.selesaiHariIni.length > 0}
      <div class="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 class="mb-3 text-base font-semibold text-gray-900">Selesai hari ini</h2>
        <div class="divide-y divide-gray-100">
          {#each data.selesaiHariIni as s (s.id)}
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-gray-900">{s.kelasNama} · {s.mapelNama}</span>
              <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Selesai {s.endedAt ? jam(s.endedAt) : ''}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Menu</h2>
      <div class="grid gap-2 sm:grid-cols-2">
        {#each menu as m (m.href)}
          <button
            onclick={() => goto(m.href)}
            class="flex items-center gap-3 rounded-lg bg-primary/5 px-4 py-3 text-left text-sm font-medium text-primary hover:bg-primary/10"
          >
            <span>{m.ikon}</span>
            <span>{m.label}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>

<!-- Langkah 14: konfirmasi wajib sebelum sesi dikunci -->
{#if konfirmasi}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div class="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 class="text-base font-semibold text-gray-900">Yakin selesai mengajar?</h3>
      <p class="mt-2 text-sm text-gray-600">
        Presensi dan jurnal akan dikunci. Sesi yang sudah ditutup tidak bisa dibuka lagi.
      </p>
      <div class="mt-6 flex gap-3">
        <button
          onclick={selesaikan}
          disabled={menutup}
          class="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {menutup ? 'Memproses...' : 'Ya, Selesai'}
        </button>
        <button
          onclick={() => (konfirmasi = false)}
          disabled={menutup}
          class="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </div>
  </div>
{/if}
