import { supabaseAdmin as supabase } from '$lib/supabase/admin.server'
import type { Kelas } from './kelas'

export async function listKelas() {
  const { data, error } = await supabase
    .from('kelas')
    .select('*')
    .is('deleted_at', null)
    .order('nama')

  if (error) throw error
  return data as Kelas[]
}

export async function createKelas(nama: string) {
  const { data, error } = await supabase
    .from('kelas')
    .insert([{ nama }])
    .select()
    .single()

  if (error) throw error
  return data as Kelas
}

export async function updateKelas(id: string, nama: string) {
  const { data, error } = await supabase
    .from('kelas')
    .update({ nama })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Kelas
}

export async function deleteKelas(id: string) {
  const { error } = await supabase
    .from('kelas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
