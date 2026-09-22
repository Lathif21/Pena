import { supabaseAdmin as supabase } from '$lib/supabase/admin.server'
import { createAccount } from './account.server'
import type { Tentor } from './tentor'

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

  // createAccount membuat baris app_users dan profiles sekaligus, dan
  // menghapus lagi user-nya kalau profil gagal dibuat. Jeda 1 detik yang dulu
  // dipakai untuk menunggu Supabase Auth tidak lagi diperlukan: keduanya kini
  // di database yang sama.
  return await createAccount({
    role: 'tentor',
    nama_lengkap,
    email,
    password,
    tahun_ajaran_id
  })
}

export async function deleteTentor(id: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
