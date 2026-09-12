import { supabase } from '$lib/supabase/client'

export interface Tentor {
  id: string
  nama_lengkap: string
  email: string
  created_at: string
  deleted_at: string | null
}

export async function listTentor() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nama_lengkap, email, created_at, deleted_at')
    .eq('role', 'tentor')
    .is('deleted_at', null)
    .order('nama_lengkap')

  if (error) throw error
  return data as Tentor[]
}

export async function createTentor(
  nama_lengkap: string,
  email: string,
  password: string,
  tahun_ajaran_id: string
) {
  if (!tahun_ajaran_id) throw new Error('Tahun ajaran wajib dipilih')

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  })

  if (authError) throw authError
  if (!authData.user?.id) throw new Error('Gagal membuat akun. Email mungkin sudah terpakai.')

  // Wait a moment for auth user to be created
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      nama_lengkap,
      email,
      role: 'tentor',
      tahun_ajaran_id
    })

  if (profileError) throw profileError

  return authData.user
}

export async function deleteTentor(id: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
