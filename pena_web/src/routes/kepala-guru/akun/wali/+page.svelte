<script lang="ts">
  import WaliTable from '$features/account/components/WaliTable.svelte'
  import AkunTabs from '$features/account/components/AkunTabs.svelte'

  let { data } = $props()
</script>

<div class="mb-6">
  <h1 class="font-serif text-2xl text-foreground">Akun Wali Murid</h1>
  <p class="mt-1 text-sm text-muted-foreground">Kelola akun wali murid</p>
</div>

<AkunTabs />

<WaliTable wali={data.wali} />
