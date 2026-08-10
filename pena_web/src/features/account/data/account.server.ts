import type { Cookies } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { supabaseAdmin } from '$lib/supabase/admin.server'

/** A role claim from the client is not authorization — re-check it server-side. */
export async function isKepalaGuru(cookies: Cookies) {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  return profile?.role === 'kepala_guru'
}

export interface NewAccount {
  role: 'tentor' | 'siswa' | 'wali_murid'
  nama_lengkap: string
  email: string
  password: string
  tahun_ajaran_id: string
}

/**
 * Creates the auth user and its profile row together. If the profile insert fails
 * the auth user is deleted again — otherwise the email stays permanently taken by
 * an account that cannot log in anywhere.
 */
export async function createAccount(account: NewAccount) {
  const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true
  })

  if (authError || !created.user) throw new Error(authError?.message ?? 'Gagal membuat akun')

  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: created.user.id,
    role: account.role,
    nama_lengkap: account.nama_lengkap,
    email: account.email,
    tahun_ajaran_id: account.tahun_ajaran_id
  })

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id).catch(() => {})
    throw new Error(profileError.message)
  }

  return created.user.id
}

/**
 * Undoes createAccount when a later step (siswa_detail, kelas link) fails. This is a
 * hard delete on purpose: the row is seconds old and never represented a real account,
 * so the never-hard-delete rule does not apply.
 */
export async function rollbackAccount(profileId: string) {
  try {
    await supabaseAdmin.from('profiles').delete().eq('id', profileId)
    await supabaseAdmin.auth.admin.deleteUser(profileId)
  } catch {
    // Rollback is best-effort — the original failure is what gets reported.
  }
}

/** Keeps the login email in sync with the profile email. */
export async function updateAccountEmail(profileId: string, email: string) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(profileId, { email })
  if (error) throw new Error(error.message)
}

export function requiredFields(form: FormData, names: string[]) {
  for (const name of names) {
    const value = form.get(name)
    if (typeof value !== 'string' || value.trim() === '') return `${name} wajib diisi`
  }
  return null
}
