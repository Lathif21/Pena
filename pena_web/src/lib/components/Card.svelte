<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    class?: string
    children: Snippet
  }

  let { class: cls = '', children }: Props = $props()
</script>

<!-- design-system.md: kedalaman datang dari kontras cream/putih, bukan shadow. -->
<div class="rounded-xl border border-border bg-card p-5 {cls}">
  {@render children()}
</div>
