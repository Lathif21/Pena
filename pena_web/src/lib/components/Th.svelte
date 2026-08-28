<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    class?: string
    children: Snippet
  }

  let { class: cls = '', children }: Props = $props()
</script>

<th class="px-4 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase {cls}">
  {@render children()}
</th>
