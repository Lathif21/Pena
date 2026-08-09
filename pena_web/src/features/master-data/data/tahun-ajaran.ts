import { supabase } from '$lib/supabase/client'

export interface TahunAjaran {
  id: string
  nama: string
  is_active: boolean
  created_at: string
  deleted_at: string | null
}

export async function listTahunAjaran() {
  const { data, error } = await supabase
    .from('tahun_ajaran')
    .select('*')
    .is('deleted_at', null)
    .order('nama', { ascending: false })

  if (error) throw error
  return data as TahunAjaran[]
}

export async function createTahunAjaran(nama: string) {
  const { data, error } = await supabase
    .from('tahun_ajaran')
    .insert([{ nama, is_active: false }])
    .select()
    .single()

  if (error) throw error
  return data as TahunAjaran
}

export async function setActiveTahunAjaran(id: string) {
  // First, deactivate all
  const { error: deactivateError } = await supabase
    .from('tahun_ajaran')
    .update({ is_active: false })
    .neq('id', id)

  if (deactivateError) throw deactivateError

  // Then activate the selected one
  const { data, error: activateError } = await supabase
    .from('tahun_ajaran')
    .update({ is_active: true })
    .eq('id', id)
    .select()
    .single()

  if (activateError) throw activateError
  return data as TahunAjaran
}

export async function deleteTahunAjaran(id: string) {
  const { error } = await supabase
    .from('tahun_ajaran')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
