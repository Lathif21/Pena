<script lang="ts">
  import MapelTable from '$features/master-data/components/MapelTable.svelte'

  let { data } = $props()
</script>

<div class="mb-6">
  <h1 class="font-serif text-2xl text-foreground">Mata Pelajaran</h1>
  <p class="mt-1 text-sm text-muted-foreground">Kelola mata pelajaran dan kelas yang memakainya</p>
</div>

<MapelTable mapel={data.mapel} />
