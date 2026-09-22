import { pesanRamah } from '$lib/utils/pesan'
import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

/**
 * Students shown here are exactly the ones this tentor teaches for the chosen mapel:
 * every siswa in a kelas assigned via tentor_kelas_mapel, plus their privat students.
 * There is no kelas picker — the assignment already decides the list.
 *
 * Resolved server-side so the browser cannot ask for a wider set than it is allowed.
 */
export async function load({ cookies, parent, url }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()
  const tentorId = parentData.user.id
  const mapelId = url.searchParams.get('mapel') ?? ''

  const [{ data: kelasMapel, error: kmError }, { data: privat }] = await Promise.all([
    supabase
      .from('tentor_kelas_mapel')
      .select('mapel_id, kelas_id')
      .eq('tentor_id', tentorId)
      .is('deleted_at', null),
    supabase
      .from('tentor_siswa_privat')
      .select('mapel_id, siswa_detail_id')
      .eq('tentor_id', tentorId)
      .is('deleted_at', null)
  ])

  if (kmError) throw svelteError(500, pesanRamah(kmError, 'Gagal menyimpan. Coba lagi sebentar.'))

  const assignments = kelasMapel ?? []
  const privatAssignments = privat ?? []

  // A tentor may teach a mapel only privately, so both sources feed the dropdown.
  const mapelIds = [...new Set([...assignments, ...privatAssignments].map((a) => a.mapel_id))]

  const { data: mapelRows } = mapelIds.length
    ? await supabase.from('mapel').select('id, nama').in('id', mapelIds).is('deleted_at', null).order('nama')
    : { data: [] as any[] }

  const mapel = mapelRows ?? []

  if (!mapelId || !mapelIds.includes(mapelId)) {
    return { ...parentData, mapel, mapelId: '', siswa: [] }
  }

  const kelasIds = assignments.filter((a) => a.mapel_id === mapelId).map((a) => a.kelas_id)

  const { data: siswaKelas } = kelasIds.length
    ? await supabase
        .from('siswa_kelas')
        .select('siswa_detail_id, kelas:kelas_id(nama)')
        .in('kelas_id', kelasIds)
        .is('deleted_at', null)
    : { data: [] as any[] }

  const kelasPerSiswa = new Map<string, string>()
  for (const sk of siswaKelas ?? []) {
    kelasPerSiswa.set(sk.siswa_detail_id, (sk as any).kelas?.nama ?? '')
  }

  for (const p of privatAssignments) {
    if (p.mapel_id === mapelId && !kelasPerSiswa.has(p.siswa_detail_id)) {
      kelasPerSiswa.set(p.siswa_detail_id, 'Privat')
    }
  }

  if (kelasPerSiswa.size === 0) {
    return { ...parentData, mapel, mapelId, siswa: [] }
  }

  const { data: siswaRows } = await supabase
    .from('siswa_detail')
    .select('id, profiles:profile_id(nama_lengkap)')
    .in('id', [...kelasPerSiswa.keys()])
    .is('deleted_at', null)

  const siswa = (siswaRows ?? [])
    .map((s: any) => ({
      siswa_detail_id: s.id,
      nama_lengkap: s.profiles?.nama_lengkap ?? '(tanpa nama)',
      kelas: kelasPerSiswa.get(s.id) ?? ''
    }))
    .sort((a, b) => a.kelas.localeCompare(b.kelas) || a.nama_lengkap.localeCompare(b.nama_lengkap))

  return { ...parentData, mapel, mapelId, siswa }
}
