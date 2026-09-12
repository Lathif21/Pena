<script lang="ts">
  import Badge from '$lib/components/Badge.svelte'
  import Card from '$lib/components/Card.svelte'
  import ProgressBar from '$lib/components/ProgressBar.svelte'
  import Table from '$lib/components/Table.svelte'
  import Th from '$lib/components/Th.svelte'
  import Td from '$lib/components/Td.svelte'
  import Button from '$lib/components/Button.svelte'
  import { GraduationCap, Download } from 'lucide-svelte'
  import { keCsv, namaBerkas } from '$lib/utils/csv'
  import { hariIni } from '$lib/utils/tanggal'

  let { data } = $props()

  let kelasPilihan = $state('')
  let cari = $state('')

  // ponytail: filter di klien. ~50 siswa, memuat semuanya sekali jauh lebih
  // murah daripada bolak-balik ke server tiap ketikan.
  let terlihat = $derived(
    data.siswa.filter((s) => {
      const cocokKelas = !kelasPilihan || s.kelasNama === kelasPilihan
      const kunci = cari.trim().toLowerCase()
      const cocokCari =
        !kunci || s.nama.toLowerCase().includes(kunci) || s.nis.toLowerCase().includes(kunci)
      return cocokKelas && cocokCari
    })
  )

  let bernilai = $derived(terlihat.filter((s) => s.rataGabungan !== null))

  let rataKelas = $derived(
    bernilai.length === 0
      ? null
      : Math.round(bernilai.reduce((t, s) => t + (s.rataGabungan ?? 0), 0) / bernilai.length)
  )

  // Di bawah 70 ditandai supaya KG bisa langsung melihat siapa yang tertinggal.
  const AMBANG = 70

  // Kolom export mengikuti yang ditampilkan tabel, ditambah paket dan jumlah
  // nilai — dua hal yang di layar hanya jadi keterangan kecil tapi berguna saat
  // datanya diolah di spreadsheet.
  const KOLOM = [
    { kunci: 'nama', judul: 'Nama' },
    { kunci: 'nis', judul: 'NIS' },
    { kunci: 'kelas', judul: 'Kelas' },
    { kunci: 'paket', judul: 'Paket' },
    { kunci: 'jumlahTryOut', judul: 'Jumlah Try Out' },
    { kunci: 'rataTryOut', judul: 'Rata-rata Try Out' },
    { kunci: 'jumlahManual', judul: 'Jumlah Nilai Manual' },
    { kunci: 'rataManual', judul: 'Rata-rata Nilai Manual' },
    { kunci: 'rataGabungan', judul: 'Rata-rata Gabungan' }
  ]

  function ekspor() {
    // Sumbernya `terlihat`, bukan data.siswa: filter kelas dan pencarian
    // berjalan di klien, jadi hanya array inilah yang benar-benar mewakili apa
    // yang sedang dilihat kepala guru.
    const baris = terlihat.map((s) => ({
      nama: s.nama,
      nis: s.nis,
      kelas: s.kelasNama || 'Privat',
      paket: s.paket === 'privat' ? 'Privat' : 'Regular',
      jumlahTryOut: s.jumlahTryOut,
      rataTryOut: s.rataTryOut,
      jumlahManual: s.jumlahManual,
      rataManual: s.rataManual,
      rataGabungan: s.rataGabungan
    }))

    const berkas = namaBerkas(
      'nilai-siswa',
      // Filternya ikut ke nama berkas, supaya file yang sudah tersimpan tetap
      // bisa dijelaskan tanpa dibuka.
      [kelasPilihan || 'semua-kelas', cari.trim() ? `cari-${cari.trim()}` : null],
      hariIni()
    )

    const url = URL.createObjectURL(new Blob([keCsv(baris, KOLOM)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = berkas
    a.click()
    URL.revokeObjectURL(url)
  }

  const gayaField =
    'mt-1 block w-full rounded-lg border border-transparent bg-input-background px-3 py-2.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none'
</script>

<svelte:head>
  <title>Overview Nilai Siswa · Pena</title>
</svelte:head>

<h1 class="font-serif text-2xl text-foreground">Overview Nilai Siswa</h1>
<p class="mt-1 text-sm text-muted-foreground">
  Rata-rata dari try out dan nilai manual. Latihan soal tidak dihitung — latihan boleh diulang
  tanpa batas, jadi angkanya tidak sebanding.
</p>

<div class="mt-6 grid gap-4 sm:grid-cols-3">
  <Card>
    <p class="text-sm text-muted-foreground">Siswa terdata</p>
    <p class="mt-2 font-mono text-3xl text-foreground">{terlihat.length}</p>
  </Card>
  <Card>
    <p class="text-sm text-muted-foreground">Sudah punya nilai</p>
    <p class="mt-2 font-mono text-3xl text-foreground">{bernilai.length}</p>
  </Card>
  <Card>
    <p class="text-sm text-muted-foreground">Rata-rata keseluruhan</p>
    <p class="mt-2 font-mono text-3xl text-foreground">{rataKelas ?? '—'}</p>
  </Card>
</div>

<Card class="mt-6">
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
    <div>
      <label for="kelas" class="block text-sm font-medium text-foreground">Kelas</label>
      <select id="kelas" bind:value={kelasPilihan} class="{gayaField} pr-8">
        <option value="">Semua kelas</option>
        {#each data.kelas as k (k)}
          <option value={k}>{k}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="cari" class="block text-sm font-medium text-foreground">Cari nama atau NIS</label>
      <input id="cari" type="search" bind:value={cari} placeholder="Ketik nama…" class={gayaField} />
    </div>
    <div class="flex items-end">
      <Button
        variant="secondary"
        onclick={ekspor}
        disabled={terlihat.length === 0}
        class="w-full lg:w-auto"
      >
        <Download class="mr-2 h-4 w-4" />
        Export ({terlihat.length})
      </Button>
    </div>
  </div>
  <p class="mt-3 text-xs text-muted-foreground">
    Export berisi tepat apa yang sedang tampil — <span class="font-mono">{terlihat.length}</span>
    siswa sesuai filter di atas, bukan seluruh data.
  </p>
</Card>

{#if data.mapel.some((m) => m.rata !== null)}
  <Card class="mt-6">
    <h2 class="mb-4 font-serif text-lg text-foreground">Rata-rata per Mata Pelajaran</h2>
    <div class="space-y-3">
      {#each data.mapel.filter((m) => m.rata !== null) as m (m.id)}
        <div>
          <div class="flex items-baseline justify-between gap-3 text-sm">
            <span class="text-foreground">{m.nama}</span>
            <span class="text-xs text-muted-foreground">
              <span class="font-mono">{m.jumlah}</span> nilai
            </span>
          </div>
          <ProgressBar value={m.rata ?? 0} />
        </div>
      {/each}
    </div>
  </Card>
{/if}

{#if terlihat.length === 0}
  <Card class="mt-6 p-8 text-center">
    <GraduationCap class="mx-auto h-8 w-8 text-muted-foreground" />
    <p class="mt-2 text-sm text-muted-foreground">Tidak ada siswa untuk filter ini.</p>
  </Card>
{:else}
  <!-- Tujuh kolom bermakna — di bawah md jadi tumpukan card. -->
  <div class="mt-6 space-y-3 md:hidden">
    {#each terlihat as s (s.siswaDetailId)}
      <Card>
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-medium text-foreground">{s.nama}</p>
            <p class="text-sm text-muted-foreground">
              <span class="font-mono">{s.nis}</span> · {s.kelasNama || 'Privat'}
            </p>
          </div>
          {#if s.rataGabungan === null}
            <Badge tone="pending">Belum ada nilai</Badge>
          {:else}
            <Badge tone={s.rataGabungan < AMBANG ? 'error' : 'success'}>{s.rataGabungan}</Badge>
          {/if}
        </div>
        <dl class="mt-3 space-y-1 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-muted-foreground">Try out</dt>
            <dd class="font-mono text-foreground">
              {s.rataTryOut ?? '—'} <span class="text-muted-foreground">({s.jumlahTryOut}×)</span>
            </dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-muted-foreground">Nilai manual</dt>
            <dd class="font-mono text-foreground">
              {s.rataManual ?? '—'} <span class="text-muted-foreground">({s.jumlahManual}×)</span>
            </dd>
          </div>
        </dl>
        <a
          href="/kepala-guru/laporan/{s.siswaDetailId}"
          class="mt-3 block text-sm font-medium text-primary hover:underline"
        >
          Cetak laporan
        </a>
      </Card>
    {/each}
  </div>

  <div class="mt-6 hidden md:block">
    <Table>
      {#snippet head()}
        <Th>Siswa</Th>
        <Th>NIS</Th>
        <Th>Kelas</Th>
        <Th>Try Out</Th>
        <Th>Nilai Manual</Th>
        <Th>Rata-rata</Th>
        <Th>Laporan</Th>
      {/snippet}
      {#snippet body()}
        {#each terlihat as s (s.siswaDetailId)}
          <tr class="border-b border-border hover:bg-muted/30">
            <Td class="font-medium">{s.nama}</Td>
            <Td numeric class="text-muted-foreground">{s.nis}</Td>
            <Td class="text-muted-foreground">{s.kelasNama || 'Privat'}</Td>
            <Td numeric>
              {s.rataTryOut ?? '—'}
              <span class="text-xs text-muted-foreground">({s.jumlahTryOut}×)</span>
            </Td>
            <Td numeric>
              {s.rataManual ?? '—'}
              <span class="text-xs text-muted-foreground">({s.jumlahManual}×)</span>
            </Td>
            <Td>
              {#if s.rataGabungan === null}
                <span class="text-xs text-muted-foreground">Belum ada nilai</span>
              {:else}
                <div class="flex items-center gap-3">
                  <ProgressBar value={s.rataGabungan} showLabel={false} class="w-24" />
                  <span
                    class="font-mono text-sm {s.rataGabungan < AMBANG
                      ? 'text-destructive'
                      : 'text-foreground'}"
                  >
                    {s.rataGabungan}
                  </span>
                </div>
              {/if}
            </Td>
            <Td>
              <a
                href="/kepala-guru/laporan/{s.siswaDetailId}"
                class="text-sm font-medium text-primary hover:underline"
              >
                Cetak
              </a>
            </Td>
          </tr>
        {/each}
      {/snippet}
    </Table>
  </div>
{/if}
