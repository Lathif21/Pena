<script lang="ts">
  interface Props {
    /** 0-100. Nilai di luar rentang dijepit, bukan ditolak. */
    value: number
    showLabel?: boolean
    class?: string
  }

  let { value, showLabel = true, class: cls = '' }: Props = $props()

  const persen = $derived(Math.max(0, Math.min(100, Math.round(value))))
</script>

<div class="flex items-center gap-3 {cls}">
  <div class="h-1.5 flex-1 rounded-full bg-muted">
    <div class="h-1.5 rounded-full bg-primary" style="width: {persen}%"></div>
  </div>
  {#if showLabel}
    <!-- Angka selalu DM Mono supaya digit sejajar antar baris. -->
    <span class="font-mono text-xs text-muted-foreground">{persen}%</span>
  {/if}
</div>
