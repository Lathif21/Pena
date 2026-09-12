<script lang="ts">
  import TentorTable from '$features/account/components/TentorTable.svelte'
  import AkunTabs from '$features/account/components/AkunTabs.svelte'

  let { data } = $props()
</script>

<svelte:head>
  <title>Akun Tentor · Pena</title>
</svelte:head>

<div class="mb-6">
  <h1 class="font-serif text-2xl text-foreground">Akun Tentor</h1>
  <p class="mt-1 text-sm text-muted-foreground">Kelola akun tentor</p>
</div>

<AkunTabs />

<TentorTable tentor={data.tentor} />
