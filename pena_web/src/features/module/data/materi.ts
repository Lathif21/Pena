import { supabase } from '$lib/supabase/client'

export interface Materi {
  id: string
  mapel_id: string
  nama: string
  nomor_urut: number
  created_at: string
  deleted_at: string | null
}

export async function listMateri(mapelId: string) {
  const { data, error } = await supabase
    .from('materi')
    .select('id, mapel_id, nama, nomor_urut, created_at, deleted_at')
    .eq('mapel_id', mapelId)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (error) throw error
  return data as Materi[]
}

export async function createMateri(mapelId: string, nama: string, nomorUrut: number) {
  const { data, error } = await supabase
    .from('materi')
    .insert({
      mapel_id: mapelId,
      nama,
      nomor_urut: nomorUrut
    })
    .select()
    .single()

  if (error) throw error
  return data as Materi
}

export async function updateMateri(id: string, nama: string, nomorUrut: number) {
  const { data, error } = await supabase
    .from('materi')
    .update({
      nama,
      nomor_urut: nomorUrut
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Materi
}

export async function softDeleteMateri(id: string) {
  const { error } = await supabase
    .from('materi')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
