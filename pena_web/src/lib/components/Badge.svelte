<script lang="ts">
  import type { Snippet } from 'svelte'

  type Tone = 'success' | 'pending' | 'info' | 'error'

  interface Props {
    tone?: Tone
    class?: string
    children: Snippet
  }

  let { tone = 'info', class: cls = '', children }: Props = $props()

  // Palet badge dikunci di design-system.md — hadir/published, draft/pending,
  // informasional, tidak hadir/locked. Jangan tambah nada baru tanpa alasan.
  const nada: Record<Tone, string> = {
    success: 'bg-emerald-100 text-emerald-800',
    pending: 'bg-amber-100 text-amber-800',
    info: 'bg-blue-100 text-blue-800',
    error: 'bg-red-100 text-red-800'
  }
</script>

<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium {nada[tone]} {cls}">
  {@render children()}
</span>
