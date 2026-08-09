import { supabase } from '$lib/supabase/client'

export interface SubMateri {
  id: string
  materi_id: string
  nama: string
  nomor_urut: number
  created_at: string
  deleted_at: string | null
}

export async function listSubMateri(materiId: string) {
  const { data, error } = await supabase
    .from('sub_materi')
    .select('id, materi_id, nama, nomor_urut, created_at, deleted_at')
    .eq('materi_id', materiId)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (error) throw error
  return data as SubMateri[]
}

export async function createSubMateri(materiId: string, nama: string, nomorUrut: number) {
  const { data, error } = await supabase
    .from('sub_materi')
    .insert({
      materi_id: materiId,
      nama,
      nomor_urut: nomorUrut
    })
    .select()
    .single()

  if (error) throw error
  return data as SubMateri
}

export async function updateSubMateri(id: string, nama: string, nomorUrut: number) {
  const { data, error } = await supabase
    .from('sub_materi')
    .update({
      nama,
      nomor_urut: nomorUrut
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as SubMateri
}

export async function softDeleteSubMateri(id: string) {
  const { error } = await supabase
    .from('sub_materi')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
