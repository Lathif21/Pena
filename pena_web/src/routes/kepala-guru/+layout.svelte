<script lang="ts">
  import AppShell from '$lib/components/AppShell.svelte'
  import {
    House,
    Users,
    Database,
    Library,
    ClipboardList,
    Camera,
    GraduationCap,
    NotebookPen
  } from 'lucide-svelte'

  let { data, children } = $props()

  // Enam item pertama design-system.md, ditambah dua dropdown atas permintaan:
  // Master Data dan Sesi Mengajar, yang sebelumnya hanya dijangkau dari kartu
  // menu di dashboard. "KPI Tentor" belum ada halamannya (Fase 5).
  const nav = [
    { href: '/kepala-guru/dashboard', label: 'Beranda', icon: House },
    {
      href: '/kepala-guru/akun/siswa',
      match: '/kepala-guru/akun',
      label: 'Manajemen Akun',
      icon: Users
    },
    {
      label: 'Master Data',
      icon: Database,
      items: [
        { href: '/kepala-guru/master-data/mapel', label: 'Mata Pelajaran' },
        { href: '/kepala-guru/master-data/kelas', label: 'Kelas' },
        { href: '/kepala-guru/master-data/tahun-ajaran', label: 'Tahun Ajaran' }
      ]
    },
    { href: '/kepala-guru/konten', label: 'Konten & Kurikulum', icon: Library },
    {
      label: 'Sesi Mengajar',
      icon: ClipboardList,
      items: [
        { href: '/kepala-guru/assignment', label: 'Assignment Tentor' },
        { href: '/kepala-guru/monitoring/sesi', label: 'Monitoring Sesi' },
        { href: '/kepala-guru/monitoring/attempt', label: 'Reset Attempt Try Out' },
        { href: '/kepala-guru/monitoring/relief', label: 'Relief' }
      ]
    },
    { href: '/kepala-guru/monitoring/presensi', label: 'Absensi Tentor', icon: Camera },
    { href: '/kepala-guru/monitoring/jurnal', label: 'Jurnal Mengajar', icon: NotebookPen },
    { href: '/kepala-guru/monitoring/nilai', label: 'Nilai Siswa', icon: GraduationCap }
  ]
</script>

<AppShell {nav} nama={data.user.nama_lengkap} peran="Kepala Guru">
  {@render children()}
</AppShell>
