<script lang="ts">
  import KelasTable from '$features/master-data/components/KelasTable.svelte'

  let { data } = $props()
</script>

<div class="mb-6">
  <h1 class="font-serif text-2xl text-foreground">Kelas</h1>
  <p class="mt-1 text-sm text-muted-foreground">Kelola daftar kelas</p>
</div>

<KelasTable kelas={data.kelas} />
