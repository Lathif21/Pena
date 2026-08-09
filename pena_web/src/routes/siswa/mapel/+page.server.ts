import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data: siswaDetail } = await supabase
    .from('siswa_detail')
    .select('id, paket')
    .eq('profile_id', parentData.user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!siswaDetail) {
    return { ...parentData, mapel: [], kelasNama: [] }
  }

  // Mapel siswa = mapel yang terhubung ke kelas siswa (relasi mapel_kelas).
  const { data: siswaKelas } = await supabase
    .from('siswa_kelas')
    .select('kelas_id, kelas:kelas_id(nama)')
    .eq('siswa_detail_id', siswaDetail.id)
    .is('deleted_at', null)

  const kelasIds = (siswaKelas ?? []).map(sk => sk.kelas_id)
  const kelasNama = (siswaKelas ?? []).map((sk: any) => sk.kelas?.nama).filter(Boolean)

  if (kelasIds.length === 0) {
    return { ...parentData, mapel: [], kelasNama: [] }
  }

  const { data: mapelKelas } = await supabase
    .from('mapel_kelas')
    .select('mapel:mapel_id(id, nama, deleted_at)')
    .in('kelas_id', kelasIds)

  // Satu mapel bisa terhubung ke beberapa kelas siswa — dedupe by id
  const seen = new Set<string>()
  const mapel = (mapelKelas ?? [])
    .map((mk: any) => mk.mapel)
    .filter((m: any) => {
      if (!m || m.deleted_at || seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
    .map((m: any) => ({ id: m.id, nama: m.nama }))
    .sort((a, b) => a.nama.localeCompare(b.nama))

  return { ...parentData, mapel, kelasNama }
}
