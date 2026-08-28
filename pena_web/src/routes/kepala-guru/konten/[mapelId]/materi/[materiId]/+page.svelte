<script lang="ts">
  import SubMateriTable from '$features/module/components/SubMateriTable.svelte'
  import Button from '$lib/components/Button.svelte'

  let { data } = $props()
</script>

<div class="mb-6">
  <a
    href="/kepala-guru/konten/{data.mapel.id}/materi"
    class="text-sm font-medium text-primary hover:underline"
  >
    ← Kembali ke {data.mapel.nama}
  </a>
</div>

<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
  <div>
    <h1 class="font-serif text-2xl text-foreground">{data.materi.nama}</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Sub materi urut <span class="font-mono">{data.materi.nomor_urut}</span> · {data.mapel.nama}
    </p>
  </div>
  <Button
    variant="secondary"
    href="/kepala-guru/konten/{data.mapel.id}/materi/{data.materi.id}/try-out"
  >
    Kelola Try Out
  </Button>
</div>

<SubMateriTable materiId={data.materi.id} materiNama={data.materi.nama} mapelId={data.mapel.id} />
