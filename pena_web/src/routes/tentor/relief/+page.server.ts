import { createSupabaseServerClient } from '$lib/supabase/server'
import { hariIni } from '$lib/utils/tanggal'

export async function load({ cookies, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()
  const tentorId = parentData.user.id

  const [{ data: assignments }, { data: tentorLain }, { data: reliefRows }] = await Promise.all([
    supabase
      .from('tentor_kelas_mapel')
      .select('kelas:kelas_id(id, nama, deleted_at), mapel:mapel_id(id, nama, deleted_at)')
      .eq('tentor_id', tentorId)
      .is('deleted_at', null),
    supabase
      .from('profiles')
      .select('id, nama_lengkap')
      .eq('role', 'tentor')
      .neq('id', tentorId)
      .is('deleted_at', null)
      .order('nama_lengkap'),
    supabase
      .from('relief')
      .select(`
        id, tanggal, task, status, email_error, pengganti_id, kelas_id, mapel_id,
        pengganti:pengganti_id(nama_lengkap),
        kelas:kelas_id(nama),
        mapel:mapel_id(nama)
      `)
      .eq('tentor_asli_id', tentorId)
      .is('deleted_at', null)
      .order('tanggal', { ascending: false })
  ])

  // Satu baris per kombinasi kelas+mapel yang benar-benar dia ajar. Dropdown
  // mapel menyaring dari sini, bukan dari seluruh mapel kelas itu.
  const kelasMapel = (assignments ?? [])
    .filter((r: any) => r.kelas && r.mapel && !r.kelas.deleted_at && !r.mapel.deleted_at)
    .map((r: any) => ({
      kelasId: r.kelas.id,
      kelasNama: r.kelas.nama,
      mapelId: r.mapel.id,
      mapelNama: r.mapel.nama
    }))
    .sort(
      (a, b) => a.kelasNama.localeCompare(b.kelasNama) || a.mapelNama.localeCompare(b.mapelNama)
    )

  const relief = (reliefRows ?? []).map((r: any) => ({
    id: r.id,
    tanggal: r.tanggal,
    task: r.task,
    status: r.status,
    emailError: r.email_error,
    penggantiNama: r.pengganti?.nama_lengkap ?? '(tanpa nama)',
    kelasNama: r.kelas?.nama ?? '',
    mapelNama: r.mapel?.nama ?? ''
  }))

  return {
    ...parentData,
    kelasMapel,
    tentorLain: (tentorLain ?? []).map((t: any) => ({ id: t.id, nama: t.nama_lengkap })),
    relief,
    hariIni: hariIni()
  }
}
