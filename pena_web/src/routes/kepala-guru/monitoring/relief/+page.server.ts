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

  let query = supabase
    .from('relief')
    .select(`
      id, tanggal, task, status, email_error, tentor_asli_id, pengganti_id,
      tentorAsli:tentor_asli_id(nama_lengkap),
      pengganti:pengganti_id(nama_lengkap),
      kelas:kelas_id(nama),
      mapel:mapel_id(nama)
    `)
    .is('deleted_at', null)
    .order('tanggal', { ascending: false })
    .limit(200)

  if (tanggal) query = query.eq('tanggal', tanggal)

  const { data: rows } = await query

  let relief = (rows ?? []).map((r: any) => ({
    id: r.id,
    tanggal: r.tanggal,
    task: r.task,
    status: r.status,
    emailError: r.email_error,
    tentorAsliId: r.tentor_asli_id,
    penggantiId: r.pengganti_id,
    tentorAsliNama: r.tentorAsli?.nama_lengkap ?? '(tanpa nama)',
    penggantiNama: r.pengganti?.nama_lengkap ?? '(tanpa nama)',
    kelasNama: r.kelas?.nama ?? '',
    mapelNama: r.mapel?.nama ?? ''
  }))

  // Filter tentor mencakup kedua sisi: KG mencari "relief yang menyangkut orang
  // ini", bukan hanya yang dia ajukan. Disaring di sini karena PostgREST tidak
  // punya OR antar dua kolom yang rapi untuk kasus ini.
  if (tentorId) {
    relief = relief.filter((r) => r.tentorAsliId === tentorId || r.penggantiId === tentorId)
  }

  return { ...parentData, tentor: tentorRows ?? [], relief, filter: { tanggal, tentorId } }
}
