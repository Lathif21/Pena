import { createSupabaseServerClient } from '$lib/supabase/server'
import { signedUrl } from '$features/attendance/data/sesi.server'

/**
 * Ringkasan satu sesi yang sudah ditutup: presensi tentor, kehadiran murid,
 * jurnal, dan nilai manual yang tentor itu masukkan pada hari yang sama.
 */
export async function load({ cookies, parent, url }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  const tanggal = url.searchParams.get('tanggal') ?? ''

  let query = supabase
    .from('sesi_mengajar')
    .select(`
      id, tentor_id, mapel_id, foto_path, uploaded_at, started_at, ended_at,
      tentor:tentor_id(nama_lengkap),
      kelas:kelas_id(nama),
      mapel:mapel_id(nama)
    `)
    .eq('status', 'closed')
    .is('deleted_at', null)
    .order('ended_at', { ascending: false })
    .limit(50)

  if (tanggal) {
    const mulai = new Date(`${tanggal}T00:00:00`)
    const habis = new Date(mulai.getTime() + 24 * 60 * 60 * 1000)
    query = query.gte('started_at', mulai.toISOString()).lt('started_at', habis.toISOString())
  }

  const { data: sesiRows } = await query
  const rows = sesiRows ?? []

  if (rows.length === 0) return { ...parentData, sesi: [], filter: { tanggal } }

  const sesiIds = rows.map((s: any) => s.id)

  const [{ data: presensi }, { data: jurnal }] = await Promise.all([
    supabase.from('presensi_murid').select('sesi_id, is_hadir').in('sesi_id', sesiIds),
    supabase
      .from('jurnal_mengajar')
      .select('sesi_id, deskripsi, status, materi:materi_id(nama, nomor_urut)')
      .in('sesi_id', sesiIds)
      .is('deleted_at', null)
  ])

  const hadirPerSesi = new Map<string, { hadir: number; total: number }>()
  for (const p of presensi ?? []) {
    const c = hadirPerSesi.get(p.sesi_id) ?? { hadir: 0, total: 0 }
    c.total += 1
    if (p.is_hadir) c.hadir += 1
    hadirPerSesi.set(p.sesi_id, c)
  }

  const jurnalPerSesi = new Map<string, any>((jurnal ?? []).map((j: any) => [j.sesi_id, j]))

  const sesi = await Promise.all(
    rows.map(async (s: any) => {
      // Nilai manual yang dimasukkan tentor ini untuk mapel ini pada hari sesi.
      const hari = new Date(s.started_at).toISOString().slice(0, 10)
      const { data: nilai } = await supabase
        .from('nilai_manual')
        .select('id, judul, nilai')
        .eq('tentor_id', s.tentor_id)
        .eq('mapel_id', s.mapel_id)
        .eq('tanggal', hari)
        .is('deleted_at', null)

      const h = hadirPerSesi.get(s.id) ?? { hadir: 0, total: 0 }
      const j = jurnalPerSesi.get(s.id)

      return {
        id: s.id,
        tentorNama: s.tentor?.nama_lengkap ?? '(tanpa nama)',
        kelasNama: s.kelas?.nama ?? '',
        mapelNama: s.mapel?.nama ?? '',
        uploadedAt: s.uploaded_at,
        startedAt: s.started_at,
        endedAt: s.ended_at,
        fotoUrl: s.foto_path ? await signedUrl(s.foto_path, 900) : null,
        hadir: h.hadir,
        totalMurid: h.total,
        jurnal: j ? { materiNama: j.materi ? `${j.materi.nomor_urut}. ${j.materi.nama}` : '—', deskripsi: j.deskripsi, status: j.status } : null,
        nilaiManual: (nilai ?? []).map((n: any) => ({ id: n.id, judul: n.judul, nilai: n.nilai }))
      }
    })
  )

  return { ...parentData, sesi, filter: { tanggal } }
}
