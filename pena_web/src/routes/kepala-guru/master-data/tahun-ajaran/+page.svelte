<script lang="ts">
  import TahunAjaranTable from '$features/master-data/components/TahunAjaranTable.svelte'

  let { data } = $props()
</script>

<div class="mb-6">
  <h1 class="font-serif text-2xl text-foreground">Tahun Ajaran</h1>
  <p class="mt-1 text-sm text-muted-foreground">Hanya satu tahun ajaran yang aktif dalam satu waktu</p>
</div>

<TahunAjaranTable tahunAjaran={data.tahunAjaran} />
