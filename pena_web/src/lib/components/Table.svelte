<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    head: Snippet
    body: Snippet
    class?: string
  }

  let { head, body, class: cls = '' }: Props = $props()
</script>

<!-- ponytail: overflow-x hanya jaring pengaman. Tabel dengan lebih dari tiga
     kolom bermakna wajib jadi tumpukan card di bawah md — itu keputusan per
     halaman karena hanya halaman yang tahu kolom mana judul card-nya. -->
<div class="overflow-x-auto rounded-xl border border-border {cls}">
  <table class="w-full">
    <thead>
      <tr class="border-b border-border bg-muted/30">
        {@render head()}
      </tr>
    </thead>
    <tbody>
      {@render body()}
    </tbody>
  </table>
</div>
