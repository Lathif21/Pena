<script lang="ts">
  import type { Titik } from '../data/types'

  interface Props {
    nilai: Titik[]
  }

  let { nilai }: Props = $props()

  // ponytail: batang CSS, bukan pustaka grafik. Yang dibutuhkan hanya tinggi
  // sebanding nilai 0-100; menambah Chart.js untuk ini berarti satu dependensi
  // penuh demi selusin div. Kalau nanti perlu sumbu, tooltip, atau garis tren,
  // barulah pindah ke LayerChart seperti disebut design-system.
  const tanggalPendek = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '—'
</script>

<!-- Boleh menggulung mendatar saat ujiannya banyak: ini data untuk dibaca,
     bukan untuk ditindak, jadi scroll masih dapat diterima di sini. -->
<div class="overflow-x-auto">
  <div class="flex min-w-max items-end gap-3 pt-6">
    {#each nilai as t (t.judul + t.tanggal)}
      <div class="flex w-16 shrink-0 flex-col items-center">
        <span class="mb-1 font-mono text-xs text-foreground">{t.nilai}</span>
        <div class="flex h-32 w-full items-end rounded-t bg-muted/40">
          <div
            class="w-full rounded-t {t.sumber === 'try_out' ? 'bg-chart-1' : 'bg-chart-2'}"
            style="height: {Math.max(2, t.nilai)}%"
          ></div>
        </div>
        <span class="mt-2 w-full truncate text-center text-xs text-foreground" title={t.judul}>
          {t.judul}
        </span>
        <span class="font-mono text-[10px] text-muted-foreground">{tanggalPendek(t.tanggal)}</span>
      </div>
    {/each}
  </div>
</div>

<!-- Label langsung, bukan legenda terpisah: di HP legenda memakan ruang yang
     seharusnya jadi grafik. -->
<p class="mt-3 text-xs text-muted-foreground">
  <span class="mr-1 inline-block h-2 w-2 rounded-full bg-chart-1"></span> Try out
  <span class="mr-1 ml-3 inline-block h-2 w-2 rounded-full bg-chart-2"></span> Nilai manual
</p>
