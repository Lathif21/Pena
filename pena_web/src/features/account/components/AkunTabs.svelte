<script lang="ts">
  import { page } from '$app/state'

  // Sidebar hanya punya satu item "Manajemen Akun"; tiga halaman akun berpindah
  // lewat tab ini.
  const tab = [
    { href: '/kepala-guru/akun/siswa', label: 'Siswa' },
    { href: '/kepala-guru/akun/tentor', label: 'Tentor' },
    { href: '/kepala-guru/akun/wali', label: 'Wali Murid' }
  ]
</script>

<nav class="mb-6 flex flex-wrap gap-2">
  {#each tab as t (t.href)}
    <a
      href={t.href}
      class="rounded-lg px-4 py-2.5 text-sm font-medium {page.url.pathname === t.href
        ? 'bg-primary text-primary-foreground'
        : 'border border-border bg-card text-foreground hover:bg-muted/40'}"
    >
      {t.label}
    </a>
  {/each}
</nav>
