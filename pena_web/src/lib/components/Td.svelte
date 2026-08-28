<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    /** Kolom angka pakai DM Mono supaya digit sejajar antar baris. */
    numeric?: boolean
    class?: string
    children: Snippet
  }

  let { numeric = false, class: cls = '', children }: Props = $props()
</script>

<td class="px-4 py-3 text-sm text-foreground {numeric ? 'font-mono' : ''} {cls}">
  {@render children()}
</td>
