<script lang="ts">
  import AppShell from '$lib/components/AppShell.svelte'
  import { House, Camera, ClipboardCheck, PencilLine, NotebookPen } from 'lucide-svelte'

  let { data, children } = $props()

  // Daftar dan urutannya dikunci di design-system.md. /tentor/modul sengaja
  // tidak di sini — tidak ada di daftar itu; dashboard sudah menautkannya.
  const nav = [
    { href: '/tentor/dashboard', label: 'Beranda', icon: House },
    { href: '/tentor/presensi/diri', label: 'Absensi Saya', icon: Camera },
    { href: '/tentor/presensi/murid', label: 'Absensi Siswa', icon: ClipboardCheck },
    { href: '/tentor/nilai', label: 'Input Nilai', icon: PencilLine },
    { href: '/tentor/jurnal', label: 'Jurnal Mengajar', icon: NotebookPen }
  ]
</script>

<AppShell {nav} nama={data.user.nama_lengkap} peran="Tentor">
  {@render children()}
</AppShell>
