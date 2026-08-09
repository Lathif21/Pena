import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, params, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data: mapel } = await supabase
    .from('mapel')
    .select('id, nama')
    .eq('id', params.mapelId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!mapel) throw svelteError(404, 'Mapel tidak ditemukan')

  const { data: materiData } = await supabase
    .from('materi')
    .select('id, nama, nomor_urut')
    .eq('mapel_id', params.mapelId)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (!materiData || materiData.length === 0) {
    return { ...parentData, mapel, materi: [] }
  }

  const { data: subMateriData } = await supabase
    .from('sub_materi')
    .select('id, nama, nomor_urut, materi_id')
    .in('materi_id', materiData.map(m => m.id))
    .is('deleted_at', null)
    .order('nomor_urut')

  if (!subMateriData || subMateriData.length === 0) {
    return { ...parentData, mapel, materi: [] }
  }

  // Hanya modul yang sudah published yang terlihat oleh siswa
  const { data: publishedModules } = await supabase
    .from('module')
    .select('sub_materi_id')
    .in('sub_materi_id', subMateriData.map(s => s.id))
    .eq('status', 'published')
    .is('deleted_at', null)

  const publishedSubIds = new Set((publishedModules ?? []).map(m => m.sub_materi_id))

  const subByMateri = new Map<string, any[]>()
  for (const sub of subMateriData) {
    if (!publishedSubIds.has(sub.id)) continue
    if (!subByMateri.has(sub.materi_id)) subByMateri.set(sub.materi_id, [])
    subByMateri.get(sub.materi_id)!.push({ id: sub.id, nama: sub.nama, nomor_urut: sub.nomor_urut })
  }

  // Materi hanya muncul jika punya minimal satu sub materi dengan modul published
  const materi = materiData
    .map(m => ({ ...m, sub_materi: subByMateri.get(m.id) ?? [] }))
    .filter(m => m.sub_materi.length > 0)

  return { ...parentData, mapel, materi }
}
