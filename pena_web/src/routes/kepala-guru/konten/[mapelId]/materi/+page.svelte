<script lang="ts">
  import MateriFull from '$features/module/components/MateriFull.svelte'

  let { data } = $props()
</script>

<div class="mb-6">
  <a href="/kepala-guru/konten" class="text-sm font-medium text-primary hover:underline">
    ← Kembali ke Kelola Konten
  </a>
</div>

<MateriFull mapelId={data.mapel.id} mapelNama={data.mapel.nama} />

<div class="mt-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
  Try out dijadwalkan per materi — buka materi, lalu pilih <strong class="text-foreground">Kelola Try Out</strong>.
</div>
