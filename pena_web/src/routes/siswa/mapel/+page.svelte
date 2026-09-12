<script lang="ts">
  import Card from '$lib/components/Card.svelte'
  import { BookOpen } from 'lucide-svelte'

  let { data } = $props()
</script>

<div class="mb-6">
  <h1 class="font-serif text-2xl text-foreground">Mata Pelajaran</h1>
  {#if data.kelasNama.length > 0}
    <p class="mt-1 text-sm text-muted-foreground">{data.kelasNama.join(', ')}</p>
  {/if}
</div>

{#if data.mapel.length === 0}
  <div class="rounded-xl border border-dashed border-border p-8 text-center">
    <BookOpen class="mx-auto h-8 w-8 text-muted-foreground" />
    <p class="mt-2 text-sm text-muted-foreground">
      {#if data.kelasNama.length === 0}
        Anda belum terdaftar di kelas mana pun. Hubungi kepala guru.
      {:else}
        Belum ada mata pelajaran untuk kelas Anda.
      {/if}
    </p>
  </div>
{:else}
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each data.mapel as mapel (mapel.id)}
      <a
        href="/siswa/mapel/{mapel.id}"
        class="block rounded-xl border border-border bg-card p-5 hover:bg-muted/40"
      >
        <h2 class="font-serif text-base text-foreground">{mapel.nama}</h2>
        <p class="mt-2 text-sm text-muted-foreground">Lihat materi dan modul</p>
      </a>
    {/each}
  </div>
{/if}
