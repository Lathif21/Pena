<script lang="ts">
  import AppShell from '$lib/components/AppShell.svelte'
  import { House, TrendingUp, CalendarCheck } from 'lucide-svelte'

  let { data, children } = $props()

  // Daftar dikunci di design-system.md.
  const nav = [
    { href: '/wali/dashboard', label: 'Beranda', icon: House },
    { href: '/wali/progress', label: 'Progress Nilai', icon: TrendingUp },
    { href: '/wali/anak', label: 'Absensi Anak', icon: CalendarCheck }
  ]
</script>

<AppShell {nav} nama={data.profile.nama_lengkap} peran="Wali Murid">
  {@render children()}
</AppShell>
