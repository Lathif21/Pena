<script lang="ts">
  import SiswaTable from '$features/account/components/SiswaTable.svelte'
  import AkunTabs from '$features/account/components/AkunTabs.svelte'

  let { data } = $props()
</script>

<svelte:head>
  <title>Akun Siswa · Pena</title>
</svelte:head>

<div class="mb-6">
  <h1 class="font-serif text-2xl text-foreground">Akun Siswa</h1>
  <p class="mt-1 text-sm text-muted-foreground">Kelola akun siswa beserta paket dan NIS</p>
</div>

<AkunTabs />

<SiswaTable siswa={data.siswa} />
