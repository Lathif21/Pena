<script lang="ts">
  import Badge from '$lib/components/Badge.svelte'
  import Card from '$lib/components/Card.svelte'
  import ProgressBar from '$lib/components/ProgressBar.svelte'
  import Table from '$lib/components/Table.svelte'
  import Th from '$lib/components/Th.svelte'
  import Td from '$lib/components/Td.svelte'
  import PilihAnak from '$features/parent/components/PilihAnak.svelte'
  import { CalendarCheck, Users } from 'lucide-svelte'

  let { data } = $props()

  const tanggalPanjang = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'full' }) : '—'

  const tanggalPendek = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '—'
</script>

<svelte:head>
  <title>Absensi Anak · Pena</title>
</svelte:head>

<div class="mb-6">
  <h1 class="font-serif text-2xl text-foreground">Absensi Anak</h1>
  <p class="mt-1 text-sm text-muted-foreground">Kehadiran di setiap pertemuan yang tercatat</p>
</div>

{#if !data.terpilih}
  <Card class="p-8 text-center">
    <Users class="mx-auto h-8 w-8 text-muted-foreground" />
    <p class="mt-2 text-sm text-muted-foreground">
      Belum ada anak yang tertaut ke akun ini. Hubungi kepala guru.
    </p>
  </Card>
{:else}
  <PilihAnak daftar={data.daftar} terpilih={data.terpilih.siswaDetailId} basis="/wali/anak" />

  <Card class="mb-6">
    <div class="flex flex-wrap items-baseline justify-between gap-3">
      <div>
        <h2 class="font-serif text-base text-foreground">{data.terpilih.nama}</h2>
        <p class="text-sm text-muted-foreground">
          <span class="font-mono">{data.terpilih.nis}</span> · {data.terpilih.kelasNama || 'Privat'}
        </p>
      </div>
      <div class="text-right">
        <p class="text-xs text-muted-foreground">Kehadiran</p>
        <p class="font-mono text-3xl text-foreground">
          {#if data.kehadiran.persen === null}
            —
          {:else}
            {data.kehadiran.persen}%
          {/if}
        </p>
      </div>
    </div>
    {#if data.kehadiran.persen !== null}
      <ProgressBar value={data.kehadiran.persen} showLabel={false} class="mt-3" />
      <p class="mt-2 text-xs text-muted-foreground">
        Hadir <span class="font-mono">{data.kehadiran.hadir}</span> dari
        <span class="font-mono">{data.kehadiran.total}</span> pertemuan
      </p>
    {/if}
  </Card>

  {#if data.kehadiran.baris.length === 0}
    <Card class="p-8 text-center">
      <CalendarCheck class="mx-auto h-8 w-8 text-muted-foreground" />
      <p class="mt-2 text-sm text-muted-foreground">
        {data.terpilih.paket === 'privat'
          ? 'Siswa privat tidak memiliki catatan presensi.'
          : 'Belum ada pertemuan yang tercatat.'}
      </p>
    </Card>
  {:else}
    <!-- Lima kolom bermakna — di bawah md jadi tumpukan card. -->
    <div class="space-y-3 md:hidden">
      {#each data.kehadiran.baris as b (b.id)}
        <Card>
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-mono text-sm text-foreground">{tanggalPendek(b.tanggal)}</p>
              <p class="truncate text-sm text-muted-foreground">{b.mapelNama} · {b.kelasNama}</p>
            </div>
            <Badge tone={b.hadir ? 'success' : 'error'}>
              {b.hadir ? 'Hadir' : 'Tidak hadir'}
            </Badge>
          </div>
          <p class="mt-2 text-xs text-muted-foreground">Tentor: {b.tentorNama}</p>
        </Card>
      {/each}
    </div>

    <div class="hidden md:block">
      <Table>
        {#snippet head()}
          <Th>Tanggal</Th>
          <Th>Mapel</Th>
          <Th>Kelas</Th>
          <Th>Tentor</Th>
          <Th>Status</Th>
        {/snippet}
        {#snippet body()}
          {#each data.kehadiran.baris as b (b.id)}
            <tr class="border-b border-border hover:bg-muted/30">
              <Td numeric>{tanggalPanjang(b.tanggal)}</Td>
              <Td>{b.mapelNama}</Td>
              <Td class="text-muted-foreground">{b.kelasNama}</Td>
              <Td class="text-muted-foreground">{b.tentorNama}</Td>
              <Td>
                <Badge tone={b.hadir ? 'success' : 'error'}>
                  {b.hadir ? 'Hadir' : 'Tidak hadir'}
                </Badge>
              </Td>
            </tr>
          {/each}
        {/snippet}
      </Table>
    </div>
  {/if}
{/if}
