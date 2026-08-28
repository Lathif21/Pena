<script lang="ts">
  import Badge from '$lib/components/Badge.svelte'
  import { BookOpen } from 'lucide-svelte'

  let { data } = $props()
</script>

<div class="mb-6">
  <h1 class="font-serif text-2xl text-foreground">Kelola Konten</h1>
  <p class="mt-1 text-sm text-muted-foreground">Pilih mata pelajaran untuk mengelola materi</p>
</div>

{#if data.mapel.length === 0}
  <div class="rounded-xl border border-dashed border-border p-8 text-center">
    <BookOpen class="mx-auto h-8 w-8 text-muted-foreground" />
    <p class="mt-2 text-sm text-muted-foreground">
      Belum ada mata pelajaran. Buat mata pelajaran terlebih dahulu.
    </p>
  </div>
{:else}
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each data.mapel as mapel (mapel.id)}
      <a
        href="/kepala-guru/konten/{mapel.id}/materi"
        class="block rounded-xl border border-border bg-card p-5 hover:bg-muted/40"
      >
        <h3 class="font-serif text-base text-foreground">{mapel.nama}</h3>
        {#if mapel.kelas_nama.length > 0}
          <div class="mt-2 flex flex-wrap gap-1">
            {#each mapel.kelas_nama as nama}
              <Badge>{nama}</Badge>
            {/each}
          </div>
        {/if}
        <p class="mt-2 text-sm text-muted-foreground">Kelola materi, sub materi, dan modul</p>
        <span class="mt-4 block text-sm font-medium text-primary">Masuk →</span>
      </a>
    {/each}
  </div>
{/if}
