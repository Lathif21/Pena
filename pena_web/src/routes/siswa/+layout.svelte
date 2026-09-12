<script lang="ts">
  import AppShell from '$lib/components/AppShell.svelte'
  import { House, BookOpen } from 'lucide-svelte'

  let { data, children } = $props()

  // design-system.md mendaftar lima item (Beranda, Belajar, Latihan Soal, Ujian,
  // Nilai Saya), tapi hanya dua yang punya halaman: latihan dan try out selalu
  // dimasuki lewat sub materi, dan /siswa/nilai belum dibangun. Item yang
  // tujuannya belum ada sengaja tidak dipasang — nav mati lebih buruk daripada
  // nav pendek.
  const nav = [
    { href: '/siswa/dashboard', label: 'Beranda', icon: House },
    { href: '/siswa/mapel', label: 'Belajar', icon: BookOpen }
  ]
</script>

<AppShell {nav} nama={data.user.nama_lengkap} peran="Siswa">
  {@render children()}
</AppShell>
