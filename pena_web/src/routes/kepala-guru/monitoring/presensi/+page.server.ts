import { createSupabaseServerClient } from '$lib/supabase/server'
import { signedUrl } from '$features/attendance/data/sesi.server'

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

  let query = supabase
    .from('sesi_mengajar')
    .select(`
      id, tentor_id, foto_path, uploaded_at, started_at, ended_at, status,
      tentor:tentor_id(nama_lengkap),
      kelas:kelas_id(nama),
      mapel:mapel_id(nama)
    `)
    .is('deleted_at', null)
    .order('uploaded_at', { ascending: false })
    .limit(200)

  if (tentorId) query = query.eq('tentor_id', tentorId)
  if (tanggal) {
    // Rentang sehari penuh di waktu lokal peramban KG; disimpan sebagai timestamptz.
    const mulai = new Date(`${tanggal}T00:00:00`)
    const habis = new Date(mulai.getTime() + 24 * 60 * 60 * 1000)
    query = query.gte('started_at', mulai.toISOString()).lt('started_at', habis.toISOString())
  }

  const { data: sesiRows } = await query

  // Signed URL diterbitkan di server. Bucket-nya privat, jadi tanpa ini foto
  // tidak bisa ditampilkan sama sekali — dan itu memang yang diinginkan.
  const sesi = await Promise.all(
    (sesiRows ?? []).map(async (s: any) => ({
      id: s.id,
      tentorNama: s.tentor?.nama_lengkap ?? '(tanpa nama)',
      kelasNama: s.kelas?.nama ?? '',
      mapelNama: s.mapel?.nama ?? '',
      uploadedAt: s.uploaded_at,
      startedAt: s.started_at,
      status: s.status,
      fotoUrl: s.foto_path ? await signedUrl(s.foto_path, 900) : null
    }))
  )

  return { ...parentData, tentor: tentorRows ?? [], sesi, filter: { tanggal, tentorId } }
}
