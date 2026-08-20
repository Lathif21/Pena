import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, parent, url }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  const tanggal = url.searchParams.get('tanggal') ?? ''
  const tentorId = url.searchParams.get('tentor') ?? ''

  const { data: tentorRows } = await supabase
    .from('profiles')
    .select('id, nama_lengkap')
    .eq('role', 'tentor')
    .is('deleted_at', null)
    .order('nama_lengkap')

  // Hanya jurnal yang sudah submitted. Draft masih milik tentor dan belum
  // dianggap selesai, jadi tidak muncul di monitoring.
  const query = supabase
    .from('jurnal_mengajar')
    .select(`
      id, deskripsi, status, submitted_at,
      materi:materi_id(nama, nomor_urut),
      sesi:sesi_id(id, tentor_id, started_at, tentor:tentor_id(nama_lengkap), kelas:kelas_id(nama), mapel:mapel_id(nama))
    `)
    .eq('status', 'submitted')
    .is('deleted_at', null)
    .order('submitted_at', { ascending: false })
    .limit(200)

  const { data: rows } = await query

  // Filter tentor dan tanggal jatuh pada tabel sesi, yang di-embed — PostgREST
  // tidak menyaring induk lewat kolom anak di sini, jadi disaring setelahnya.
  interface JurnalRingkas {
    id: string
    deskripsi: string
    submittedAt: string | null
    materiNama: string
    tentorId: string
    tentorNama: string
    kelasNama: string
    mapelNama: string
    tanggalSesi: string | null
  }

  let jurnal: JurnalRingkas[] = (rows ?? []).map((j: any) => ({
    id: j.id,
    deskripsi: j.deskripsi,
    submittedAt: j.submitted_at,
    materiNama: j.materi ? `${j.materi.nomor_urut}. ${j.materi.nama}` : '—',
    tentorId: j.sesi?.tentor_id ?? '',
    tentorNama: j.sesi?.tentor?.nama_lengkap ?? '(tanpa nama)',
    kelasNama: j.sesi?.kelas?.nama ?? '',
    mapelNama: j.sesi?.mapel?.nama ?? '',
    tanggalSesi: j.sesi?.started_at ?? null
  }))

  if (tentorId) jurnal = jurnal.filter((j) => j.tentorId === tentorId)
  if (tanggal) {
    const mulai = new Date(`${tanggal}T00:00:00`).getTime()
    const habis = mulai + 24 * 60 * 60 * 1000
    jurnal = jurnal.filter((j) => {
      if (!j.tanggalSesi) return false
      const t = new Date(j.tanggalSesi).getTime()
      return t >= mulai && t < habis
    })
  }

  return { ...parentData, tentor: tentorRows ?? [], jurnal, filter: { tanggal, tentorId } }
}
