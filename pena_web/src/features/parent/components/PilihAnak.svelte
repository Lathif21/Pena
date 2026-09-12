<script lang="ts">
  import type { Anak } from '../data/types'

  interface Props {
    daftar: Anak[]
    terpilih: string
    /** Rute tujuan; id anak dikirim lewat query string. */
    basis: string
  }

  let { daftar, terpilih, basis }: Props = $props()
</script>

<!-- Satu anak tidak perlu pemilih; wali dengan satu anak adalah kasus umum. -->
{#if daftar.length > 1}
  <nav class="mb-6 flex flex-wrap gap-2">
    {#each daftar as a (a.siswaDetailId)}
      <a
        href="{basis}?anak={a.siswaDetailId}"
        class="rounded-lg px-4 py-2.5 text-sm font-medium {a.siswaDetailId === terpilih
          ? 'bg-primary text-primary-foreground'
          : 'border border-border bg-card text-foreground hover:bg-muted/40'}"
      >
        {a.nama}
      </a>
    {/each}
  </nav>
{/if}
