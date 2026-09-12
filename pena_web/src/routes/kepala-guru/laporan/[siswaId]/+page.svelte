<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import ProgressBar from '$lib/components/ProgressBar.svelte'
  import GrafikNilai from '$features/parent/components/GrafikNilai.svelte'
  import { Printer } from 'lucide-svelte'

  let { data } = $props()

  const tanggal = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '—'

  const dicetak = new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })
</script>

<svelte:head>
  <title>Laporan {data.siswa.nama} · Pena</title>
</svelte:head>

<!-- Cetak lewat Ctrl+P, tanpa pustaka PDF. Sidebar, tombol, dan chrome lain
     disembunyikan di @media print; yang tersisa hanya isi laporannya. -->
<div class="cetak-area mx-auto max-w-3xl">
  <div class="mb-6 flex flex-wrap items-start justify-between gap-3 no-print">
    <a href="/kepala-guru/monitoring/nilai" class="text-sm font-medium text-primary hover:underline">
      ← Kembali ke Nilai Siswa
    </a>
    <Button onclick={() => window.print()}>
      <Printer class="mr-2 h-4 w-4" />
      Cetak / Simpan PDF
    </Button>
  </div>

  <header class="mb-6 border-b border-border pb-4">
    <h1 class="font-serif text-2xl text-foreground">Laporan Hasil Belajar</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Pena · Tahun Ajaran {data.tahunAjaran} · dicetak {dicetak}
    </p>
  </header>

  <dl class="mb-6 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
    <div class="flex justify-between gap-3 border-b border-border py-1">
      <dt class="text-muted-foreground">Nama</dt>
      <dd class="font-medium text-foreground">{data.siswa.nama}</dd>
    </div>
    <div class="flex justify-between gap-3 border-b border-border py-1">
      <dt class="text-muted-foreground">NIS</dt>
      <dd class="font-mono text-foreground">{data.siswa.nis}</dd>
    </div>
    <div class="flex justify-between gap-3 border-b border-border py-1">
      <dt class="text-muted-foreground">Kelas</dt>
      <dd class="text-foreground">{data.siswa.kelasNama || 'Privat'}</dd>
    </div>
    <div class="flex justify-between gap-3 border-b border-border py-1">
      <dt class="text-muted-foreground">Paket</dt>
      <dd class="text-foreground">{data.siswa.paket === 'privat' ? 'Privat' : 'Regular'}</dd>
    </div>
  </dl>

  <section class="mb-6">
    <h2 class="mb-3 font-serif text-lg text-foreground">Ringkasan</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="rounded-lg border border-border p-4">
        <p class="text-xs text-muted-foreground">Rata-rata nilai</p>
        <p class="mt-1 font-mono text-2xl text-foreground">{data.nilai.rataKeseluruhan ?? '—'}</p>
        <p class="mt-1 text-xs text-muted-foreground">
          dari <span class="font-mono">{data.nilai.jumlah}</span> nilai tercatat
        </p>
      </div>
      <div class="rounded-lg border border-border p-4">
        <p class="text-xs text-muted-foreground">Kehadiran</p>
        <p class="mt-1 font-mono text-2xl text-foreground">
          {#if data.kehadiran.persen === null}—{:else}{data.kehadiran.persen}%{/if}
        </p>
        <p class="mt-1 text-xs text-muted-foreground">
          hadir <span class="font-mono">{data.kehadiran.hadir}</span> dari
          <span class="font-mono">{data.kehadiran.total}</span> pertemuan
        </p>
      </div>
    </div>
  </section>

  <section class="mb-6">
    <h2 class="mb-3 font-serif text-lg text-foreground">Nilai per Mata Pelajaran</h2>
    {#if data.nilai.perMapel.length === 0}
      <p class="text-sm text-muted-foreground">Belum ada nilai tercatat.</p>
    {:else}
      <div class="space-y-5">
        {#each data.nilai.perMapel as m (m.mapelId)}
          <div class="hindari-putus">
            <div class="flex flex-wrap items-baseline justify-between gap-3">
              <h3 class="font-serif text-base text-foreground">{m.nama}</h3>
              <span class="text-sm text-muted-foreground">
                Rata-rata <span class="font-mono text-foreground">{m.rata ?? '—'}</span>
              </span>
            </div>
            {#if m.rata !== null}
              <ProgressBar value={m.rata} showLabel={false} class="mt-2" />
            {/if}
            <GrafikNilai nilai={m.nilai} />
          </div>
        {/each}
      </div>
    {/if}
  </section>

  {#if data.kehadiran.baris.length > 0}
    <section class="mb-6">
      <h2 class="mb-3 font-serif text-lg text-foreground">Riwayat Kehadiran</h2>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border">
            <th class="px-2 py-2 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">Tanggal</th>
            <th class="px-2 py-2 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">Mapel</th>
            <th class="px-2 py-2 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">Tentor</th>
            <th class="px-2 py-2 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">Status</th>
          </tr>
        </thead>
        <tbody>
          {#each data.kehadiran.baris as b (b.id)}
            <tr class="border-b border-border">
              <td class="px-2 py-1.5 font-mono">{tanggal(b.tanggal)}</td>
              <td class="px-2 py-1.5">{b.mapelNama}</td>
              <td class="px-2 py-1.5 text-muted-foreground">{b.tentorNama}</td>
              <td class="px-2 py-1.5">{b.hadir ? 'Hadir' : 'Tidak hadir'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/if}

  <footer class="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
    Nilai berasal dari try out dan nilai manual. Latihan soal tidak dihitung karena boleh diulang
    tanpa batas.
  </footer>
</div>

<style>
  @media print {
    /* Sidebar dan tombol tidak ikut tercetak; keduanya di luar .cetak-area
       atau ditandai .no-print. */
    :global(aside),
    :global(header.sticky),
    .no-print {
      display: none !important;
    }
    :global(body) {
      background: #fff;
    }
    :global(.lg\:pl-60) {
      padding-left: 0 !important;
    }
    :global(main) {
      max-width: none !important;
      padding: 0 !important;
    }
    /* Satu mapel tidak dipotong di tengah antar halaman. */
    .hindari-putus {
      break-inside: avoid;
    }
  }
</style>
