import { supabaseAdmin } from '$lib/supabase/admin.server'
import { hashPassword } from '$lib/auth/password.server'

export { isKepalaGuru } from '$lib/supabase/guard.server'

export interface NewAccount {
  role: 'tentor' | 'siswa' | 'wali_murid'
  nama_lengkap: string
  email: string
  password: string
  tahun_ajaran_id: string
}

/**
 * Creates the login user and its profile row together. If the profile insert fails
 * the login user is deleted again — otherwise the email stays permanently taken by
 * an account that cannot log in anywhere.
 */
export async function createAccount(account: NewAccount) {
  const { data: created, error: authError } = await supabaseAdmin
    .from('app_users')
    .insert({ email: account.email, password_hash: await hashPassword(account.password) })
    .select('id')
    .single()

  if (authError || !created) throw new Error(authError?.message ?? 'Gagal membuat akun')

  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: created.id,
    role: account.role,
    nama_lengkap: account.nama_lengkap,
    email: account.email,
    tahun_ajaran_id: account.tahun_ajaran_id
  })

  if (profileError) {
    await supabaseAdmin.from('app_users').delete().eq('id', created.id)
    throw new Error(profileError.message)
  }

  return created.id as string
}

/**
 * Undoes createAccount when a later step (siswa_detail, kelas link) fails. This is a
 * hard delete on purpose: the row is seconds old and never represented a real account,
 * so the never-hard-delete rule does not apply.
 */
export async function rollbackAccount(profileId: string) {
  try {
    await supabaseAdmin.from('profiles').delete().eq('id', profileId)
    await supabaseAdmin.from('app_users').delete().eq('id', profileId)
  } catch {
    // Rollback is best-effort — the original failure is what gets reported.
  }
}

/** Keeps the login email in sync with the profile email. */
export async function updateAccountEmail(profileId: string, email: string) {
  const { error } = await supabaseAdmin.from('app_users').update({ email }).eq('id', profileId)
  if (error) throw new Error(error.message)
}

export function requiredFields(form: FormData, names: string[]) {
  for (const name of names) {
    const value = form.get(name)
    if (typeof value !== 'string' || value.trim() === '') return `${name} wajib diisi`
  }
  return null
}
