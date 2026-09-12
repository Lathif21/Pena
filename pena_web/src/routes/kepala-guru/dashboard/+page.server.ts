import { redirect } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { hariIni, periodeBulanan } from '$lib/utils/tanggal'

export async function load({ cookies, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  const counts = await Promise.all([
    supabase.from('mapel').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('kelas').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('siswa_detail').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'tentor').is('deleted_at', null),
    supabase.from('materi').select('id', { count: 'exact', head: true }).is('deleted_at', null)
  ])

  const [mapel, kelas, siswa, tentor, materi] = counts.map(r => r.count ?? 0)

  // Batas hari mengikuti WIB, bukan waktu server. Server UTC menggeser
  // pergantian hari ke pukul 07:00 WIB, jadi sesi pagi akan terhitung sebagai
  // "kemarin" sepanjang jam sibuk bimbel.
  const tanggalIni = hariIni()
  const mulaiHariIni = new Date(`${tanggalIni}T00:00:00+07:00`)
  const habisHariIni = new Date(mulaiHariIni.getTime() + 24 * 60 * 60 * 1000)

  const { data: sesiRows } = await supabase
    .from('sesi_mengajar')
    .select(`
      id, foto_path, started_at, ended_at, status,
      tentor:tentor_id(nama_lengkap),
      kelas:kelas_id(nama),
      mapel:mapel_id(nama)
    `)
    .is('deleted_at', null)
    .gte('started_at', mulaiHariIni.toISOString())
    .lt('started_at', habisHariIni.toISOString())
    .order('started_at')

  // Foto tidak ditampilkan di dashboard — hanya penanda ada/tidak. Signed URL
  // sengaja tidak diterbitkan di sini; halaman Absensi Tentor yang mengurusnya.
  const absensiHariIni = (sesiRows ?? []).map((s: any) => ({
    id: s.id,
    tentorNama: s.tentor?.nama_lengkap ?? '(tanpa nama)',
    kelasNama: s.kelas?.nama ?? '',
    mapelNama: s.mapel?.nama ?? '',
    startedAt: s.started_at,
    endedAt: s.ended_at,
    adaFoto: !!s.foto_path,
    status: s.status
  }))

  const { data: jurnalRows } = await supabase
    .from('jurnal_mengajar')
    .select(`
      id, deskripsi, submitted_at,
      materi:materi_id(nama),
      sesi:sesi_id(started_at, tentor:tentor_id(nama_lengkap), kelas:kelas_id(nama), mapel:mapel_id(nama))
    `)
    .eq('status', 'submitted')
    .is('deleted_at', null)
    .order('submitted_at', { ascending: false })
    .limit(5)

  const jurnalTerbaru = (jurnalRows ?? []).map((j: any) => ({
    id: j.id,
    tentorNama: j.sesi?.tentor?.nama_lengkap ?? '(tanpa nama)',
    kelasNama: j.sesi?.kelas?.nama ?? '',
    mapelNama: j.sesi?.mapel?.nama ?? '',
    materiNama: j.materi?.nama ?? '—',
    deskripsi: j.deskripsi,
    submittedAt: j.submitted_at
  }))

  const jurnalHariIni = jurnalTerbaru.filter((j) => {
    if (!j.submittedAt) return false
    const t = new Date(j.submittedAt).getTime()
    return t >= mulaiHariIni.getTime() && t < habisHariIni.getTime()
  }).length

  // Ringkasan nilai. Latihan (sub_materi_id) tidak ikut — sama seperti di
  // halaman Overview Nilai, latihan tidak pernah dihitung sebagai nilai.
  const [{ data: attemptRows }, { data: manualRows }] = await Promise.all([
    supabase
      .from('attempt')
      .select('nilai')
      .not('try_out_id', 'is', null)
      .not('nilai', 'is', null)
      .eq('is_active', true)
      .is('deleted_at', null),
    supabase.from('nilai_manual').select('nilai').is('deleted_at', null)
  ])

  const semuaNilai = [
    ...(attemptRows ?? []).map((a: any) => a.nilai as number),
    ...(manualRows ?? []).map((n: any) => n.nilai as number)
  ]

  const nilai = {
    jumlah: semuaNilai.length,
    rata:
      semuaNilai.length === 0
        ? null
        : Math.round(semuaNilai.reduce((a, b) => a + b, 0) / semuaNilai.length),
    diBawahAmbang: semuaNilai.filter((n) => n < 70).length
  }

  // --- Widget overview (Langkah 8) -----------------------------------------
  const tujuhHari = new Date(mulaiHariIni.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [{ data: tryOutRows }, { data: reliefRows }, { count: jurnalMasuk }] = await Promise.all([
    supabase
      .from('try_out')
      .select('id, judul, waktu_buka, tipe_test, materi:materi_id(nama, mapel:mapel_id(nama))')
      .eq('status', 'published')
      .gte('waktu_buka', mulaiHariIni.toISOString())
      .lt('waktu_buka', tujuhHari.toISOString())
      .is('deleted_at', null)
      .order('waktu_buka'),
    supabase
      .from('relief')
      .select('id, task, tentorAsli:tentor_asli_id(nama_lengkap), pengganti:pengganti_id(nama_lengkap), kelas:kelas_id(nama), mapel:mapel_id(nama)')
      .eq('tanggal', tanggalIni)
      .eq('status', 'aktif')
      .is('deleted_at', null),
    // Jurnal yang masuk sepekan terakhir. Bukan "belum direview": tidak ada
    // status review di skema, dan sesi-mengajar.md memang melarang tombol
    // setujui/tolak — sistem mencatat, kepala guru menilai sendiri.
    supabase
      .from('jurnal_mengajar')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted')
      .gte('submitted_at', new Date(mulaiHariIni.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString())
      .is('deleted_at', null)
  ])

  const overview = {
    tanggal: tanggalIni,
    tentorTotal: tentor,
    tentorHadir: new Set(
      (sesiRows ?? []).filter((s: any) => s.foto_path).map((s: any) => s.tentor?.nama_lengkap)
    ).size,
    sesiSelesai: (sesiRows ?? []).filter((s: any) => s.status === 'closed').length,
    sesiTotal: (sesiRows ?? []).length,
    jurnalMasuk: jurnalMasuk ?? 0,
    tryOut: (tryOutRows ?? []).map((t: any) => ({
      id: t.id,
      judul: t.judul,
      waktuBuka: t.waktu_buka,
      tipe: t.tipe_test,
      mapelNama: t.materi?.mapel?.nama ?? ''
    })),
    relief: (reliefRows ?? []).map((r: any) => ({
      id: r.id,
      tentorAsliNama: r.tentorAsli?.nama_lengkap ?? '',
      penggantiNama: r.pengganti?.nama_lengkap ?? '',
      kelasNama: r.kelas?.nama ?? '',
      mapelNama: r.mapel?.nama ?? ''
    }))
  }

  // KPI dibaca dari snapshot, tidak dihitung di sini: dashboard dibuka jauh
  // lebih sering daripada KPI berubah, dan perhitungannya menyentuh banyak
  // tabel. Halaman KPI yang membuat snapshot-nya.
  const { mulai } = periodeBulanan(hariIni())
  const { data: kpiRows } = await supabase
    .from('kpi_snapshot')
    .select('skor, nilai_gain, nilai_jurnal, jumlah_sesi, tentor:tentor_id(nama_lengkap)')
    .eq('periode_mulai', mulai)
    .eq('tahun_ajaran_id', parentData.profile.tahun_ajaran_id)
    .is('deleted_at', null)
    .order('skor', { ascending: false })

  const kpi = (kpiRows ?? []).map((k: any) => ({
    nama: k.tentor?.nama_lengkap ?? '(tanpa nama)',
    skor: Number(k.skor),
    gain: k.nilai_gain === null ? null : Number(k.nilai_gain),
    jurnal: k.nilai_jurnal === null ? null : Number(k.nilai_jurnal),
    jumlahSesi: k.jumlah_sesi
  }))

  return {
    ...parentData,
    overview,
    kpi,
    stats: { mapel, kelas, siswa, tentor, materi },
    absensiHariIni,
    jurnalTerbaru,
    jurnalHariIni,
    nilai
  }
}

export const actions = {
  logout: async ({ cookies }) => {
    const supabase = createSupabaseServerClient(cookies)
    await supabase.auth.signOut()
    redirect(303, '/auth/login')
  }
}
