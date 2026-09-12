<script lang="ts">
  import Button from '$lib/components/Button.svelte'
  import Card from '$lib/components/Card.svelte'
  import { FileX } from 'lucide-svelte'

  let { data } = $props()

  let fullscreen = $state(false)
</script>

<svelte:head>
  <title>{data.subMateri.nama} · Pena</title>
</svelte:head>

<div class="mx-auto max-w-5xl">
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <a href="/siswa/mapel/{data.mapelId}" class="text-sm font-medium text-primary hover:underline">
          ← Kembali
        </a>
        <h1 class="mt-4 font-serif text-2xl text-foreground">{data.subMateri.nama}</h1>
      </div>

      <div class="flex items-center gap-3">
        {#if data.hasLatihan}
          <Button href="/siswa/mapel/{data.mapelId}/materi/{data.materiId}/{data.subMateri.id}/latihan">
            Kerjakan Latihan
          </Button>
        {/if}
        <Button variant="secondary" onclick={() => (fullscreen = !fullscreen)}>
          {fullscreen ? 'Perkecil' : 'Layar Penuh'}
        </Button>
      </div>
    </div>

    {#if data.signedUrl}
      <Card class="p-4">
        <iframe
          src={data.signedUrl}
          title={data.subMateri.nama}
          class="w-full rounded-lg border border-border {fullscreen ? 'h-[90vh]' : 'h-[70vh]'}"
        ></iframe>
      </Card>
    {:else}
      <div class="rounded-xl border border-dashed border-border p-8 text-center">
        <FileX class="mx-auto h-8 w-8 text-muted-foreground" />
        <p class="mt-2 text-sm text-muted-foreground">Modul tidak dapat dimuat.</p>
      </div>
    {/if}
</div>
