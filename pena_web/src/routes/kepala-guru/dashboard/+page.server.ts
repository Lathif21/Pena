import { redirect } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

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

  // Rentang hari ini di waktu server. Sesi disimpan sebagai timestamptz.
  const mulaiHariIni = new Date()
  mulaiHariIni.setHours(0, 0, 0, 0)
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

  return {
    ...parentData,
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
