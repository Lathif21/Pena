import { supabase } from '$lib/supabase/client'

export interface Mapel {
  id: string
  nama: string
  created_at: string
  deleted_at: string | null
}

export async function listMapel() {
  const { data, error } = await supabase
    .from('mapel')
    .select('*')
    .is('deleted_at', null)
    .order('nama')

  if (error) throw error
  return data as Mapel[]
}

export async function createMapel(nama: string) {
  const { data, error } = await supabase
    .from('mapel')
    .insert([{ nama }])
    .select()
    .single()

  if (error) throw error
  return data as Mapel
}

export async function updateMapel(id: string, nama: string) {
  const { data, error } = await supabase
    .from('mapel')
    .update({ nama })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Mapel
}

export async function deleteMapel(id: string) {
  const { error } = await supabase
    .from('mapel')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
