import { createSupabaseServerClient } from '$lib/supabase/server'
import { reliefHariIniLengkap } from '$features/relief/data/relief.server'

export async function load({ cookies, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()
  const user = parentData.user

  if (!user) {
    return { mapel: [], materiBulk: {}, mapelKelasMap: {}, kelasLookup: {} }
  }

  try {
    // Get mapel and kelas this tentor teaches (from tentor_kelas_mapel)
    const { data: tentorMapels } = await supabase
      .from('tentor_kelas_mapel')
      .select('mapel_id, kelas_id')
      .eq('tentor_id', user.id)
      .is('deleted_at', null)

    // Mapel dari relief hari ini ikut ditampilkan meski tentor ini tidak
    // mengajarnya: pengganti perlu membaca modulnya untuk sesi yang dia ambil.
    // Bentuknya disamakan dengan baris tentor_kelas_mapel supaya seluruh alur di
    // bawah ini tidak perlu tahu asal-usulnya.
    const relief = await reliefHariIniLengkap(supabase, user.id)
    const assignments = [
      ...(tentorMapels ?? []),
      ...relief.map((r) => ({ mapel_id: r.mapelId, kelas_id: r.kelasId }))
    ]

    if (assignments.length === 0) {
      return { mapel: [], materiBulk: {}, mapelKelasMap: {}, kelasLookup: {} }
    }

    const mapelIds = [...new Set(assignments.map(tm => tm.mapel_id))]
    const kelasIds = [...new Set(assignments.map(tm => tm.kelas_id))]

    // Get mapel details
    const { data: mapelData } = await supabase
      .from('mapel')
      .select('id, nama')
      .in('id', mapelIds)
      .is('deleted_at', null)
      .order('nama')

    // Get kelas details
    const { data: kelasData } = await supabase
      .from('kelas')
      .select('id, nama')
      .in('id', kelasIds)
      .is('deleted_at', null)

    // Create kelas lookup map
    const kelasLookup = new Map(
      kelasData?.map(k => [k.id, k]) || []
    )

    // Map kelas to mapel
    const mapelKelasMap = new Map<string, string[]>()
    assignments.forEach(tm => {
      if (!mapelKelasMap.has(tm.mapel_id)) {
        mapelKelasMap.set(tm.mapel_id, [])
      }
      mapelKelasMap.get(tm.mapel_id)?.push(tm.kelas_id)
    })

    if (!mapelData || mapelData.length === 0) {
      return { mapel: [], materiBulk: {}, mapelKelasMap: Object.fromEntries(mapelKelasMap), kelasLookup: Object.fromEntries(kelasLookup) }
    }

    // Get materi for these mapel
    const { data: materiData } = await supabase
      .from('materi')
      .select('id, nama, nomor_urut, mapel_id')
      .in('mapel_id', mapelIds)
      .is('deleted_at', null)
      .order('nomor_urut')

    if (!materiData || materiData.length === 0) {
      return { mapel: mapelData, materiBulk: {}, mapelKelasMap: Object.fromEntries(mapelKelasMap), kelasLookup: Object.fromEntries(kelasLookup) }
    }

    // Get sub_materi
    const { data: subMateriData } = await supabase
      .from('sub_materi')
      .select('id, nama, nomor_urut, materi_id')
      .in('materi_id', materiData.map(m => m.id))
      .is('deleted_at', null)
      .order('nomor_urut')

    if (!subMateriData || subMateriData.length === 0) {
      return { mapel: mapelData, materiBulk: {}, mapelKelasMap: Object.fromEntries(mapelKelasMap), kelasLookup: Object.fromEntries(kelasLookup) }
    }

    // Get PUBLISHED modules for these sub_materi
    const { data: moduleData } = await supabase
      .from('module')
      .select('id, status, storage_path, sub_materi_id')
      .in('sub_materi_id', subMateriData.map(s => s.id))
      .eq('status', 'published')

    // Build lookup maps
    const moduleLookup = new Map(
      moduleData?.map(m => [m.sub_materi_id, m]) || []
    )
    const subMateriMap = new Map(
      (subMateriData || [])
        .map(s => [s.id, s])
        .reduce((acc, [id, s]) => {
          if (!acc.has(s.materi_id)) acc.set(s.materi_id, [])
          acc.get(s.materi_id)?.push({ ...s, module: moduleLookup.get(s.id) })
          return acc
        }, new Map())
    )
    const materiMap = new Map(
      (materiData || [])
        .map(m => [m.id, m])
        .reduce((acc, [id, m]) => {
          if (!acc.has(m.mapel_id)) acc.set(m.mapel_id, [])
          const subMateri = subMateriMap.get(m.id) || []
          if (subMateri.length > 0) {
            acc.get(m.mapel_id)?.push({ ...m, sub_materi: subMateri })
          }
          return acc
        }, new Map())
    )

    const materiBulk: Record<string, any[]> = {}
    for (const mapel of mapelData) {
      materiBulk[mapel.id] = materiMap.get(mapel.id) || []
    }

    return {
      mapel: mapelData,
      materiBulk,
      mapelKelasMap: Object.fromEntries(mapelKelasMap),
      kelasLookup: Object.fromEntries(kelasLookup)
    }
  } catch (err) {
    console.error('Tentor modul load error:', err)
    return { mapel: [], materiBulk: {}, mapelKelasMap: {}, kelasLookup: {} }
  }
}
