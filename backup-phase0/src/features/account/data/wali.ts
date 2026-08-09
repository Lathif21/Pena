import { supabase } from '$lib/supabase/client'

export interface Wali {
  id: string
  nama_lengkap: string
  email: string
  created_at: string
  deleted_at: string | null
}

export async function listWali() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nama_lengkap, email, created_at, deleted_at')
    .eq('role', 'wali_murid')
    .is('deleted_at', null)
    .order('nama_lengkap')

  if (error) throw error
  return data as Wali[]
}

export async function createWali(
  nama_lengkap: string,
  email: string,
  password: string,
  tahun_ajaran_id: string,
  siswa_ids: string[]
) {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  })

  if (authError) throw authError
  if (!authData.user?.id) throw new Error('Failed to create auth user')

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      nama_lengkap,
      email,
      role: 'wali_murid',
      tahun_ajaran_id
    })

  if (profileError) throw profileError

  // Link to siswa
  if (siswa_ids && siswa_ids.length > 0) {
    const assignments = siswa_ids.map((siswa_detail_id) => ({
      wali_id: authData.user!.id,
      siswa_detail_id
    }))

    const { error: linkError } = await supabase.from('wali_siswa').insert(assignments)

    if (linkError) throw linkError
  }

  return authData.user
}

export async function deleteWali(id: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
