<script lang="ts">
  import AppShell from '$lib/components/AppShell.svelte'
  import { House, Users, Library, Camera, NotebookPen } from 'lucide-svelte'

  let { data, children } = $props()

  // Daftar dan urutannya dikunci di design-system.md. "KPI Tentor" belum ada
  // halamannya (Fase 5) jadi belum dipasang. Master data, assignment, sesi, dan
  // reset attempt tidak ada di daftar itu — dashboard yang menautkannya.
  const nav = [
    { href: '/kepala-guru/dashboard', label: 'Beranda', icon: House },
    {
      href: '/kepala-guru/akun/siswa',
      match: '/kepala-guru/akun',
      label: 'Manajemen Akun',
      icon: Users
    },
    { href: '/kepala-guru/konten', label: 'Konten & Kurikulum', icon: Library },
    { href: '/kepala-guru/monitoring/presensi', label: 'Absensi Tentor', icon: Camera },
    { href: '/kepala-guru/monitoring/jurnal', label: 'Jurnal Mengajar', icon: NotebookPen }
  ]
</script>

<AppShell {nav} nama={data.user.nama_lengkap} peran="Kepala Guru">
  {@render children()}
</AppShell>
