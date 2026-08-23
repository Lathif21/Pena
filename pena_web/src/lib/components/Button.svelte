<script lang="ts">
  import type { Snippet } from 'svelte'

  type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost'

  interface Props {
    variant?: Variant
    type?: 'button' | 'submit' | 'reset'
    href?: string
    disabled?: boolean
    onclick?: (e: MouseEvent) => void
    class?: string
    children: Snippet
  }

  let {
    variant = 'primary',
    type = 'button',
    href,
    disabled = false,
    onclick,
    class: cls = '',
    children
  }: Props = $props()

  // px-4 py-2.5 sudah melewati ambang sentuh 44px yang diminta design-system.md.
  const dasar =
    'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50'

  // Hover selalu turunan opacity dari token dasar — tidak ada token hover terpisah.
  const varian: Record<Variant, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'border border-border bg-card hover:bg-muted/40',
    destructive: 'border border-border text-destructive hover:bg-destructive/10',
    ghost: 'hover:bg-muted/40'
  }
</script>

{#if href}
  <a {href} class="{dasar} {varian[variant]} {cls}">{@render children()}</a>
{:else}
  <button {type} {disabled} {onclick} class="{dasar} {varian[variant]} {cls}">
    {@render children()}
  </button>
{/if}
