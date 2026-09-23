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

/**
 * Kepala guru mengganti password akun lain. `role` dicocokkan ke profil supaya id
 * yang diutak-atik dari form tidak bisa dipakai mengganti password kepala guru.
 * Semua sesi akun itu dibuang: password lama bocor adalah alasan paling umum
 * orang minta diganti, jadi sesi yang dibuka dengannya ikut mati.
 */
export async function resetAccountPassword(
  profileId: string,
  role: NewAccount['role'],
  password: string
) {
  if (!profileId) throw new Error('Akun tidak dikenali. Muat ulang halaman lalu coba lagi.')
  if (password.length < 8) throw new Error('Password minimal 8 karakter')

  const { data: profile, error: cariError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .eq('role', role)
    .is('deleted_at', null)
    .maybeSingle()

  // Error database dilempar apa adanya (pesanRamah menggantinya dengan cadangan),
  // supaya gangguan server tidak tampil sebagai "akun tidak ditemukan".
  if (cariError) throw cariError
  if (!profile) throw new Error('Akun tidak ditemukan. Muat ulang halaman lalu coba lagi.')

  const { data: diubah, error } = await supabaseAdmin
    .from('app_users')
    .update({ password_hash: await hashPassword(password) })
    .eq('id', profileId)
    .select('id')
  if (error) throw error
  if (!diubah?.length) throw new Error('Akun ini tidak punya data login. Hubungi pengelola aplikasi.')

  const { error: sesiError } = await supabaseAdmin.from('sessions').delete().eq('user_id', profileId)
  if (sesiError) {
    throw new Error('Password sudah diganti, tapi akun ini belum dikeluarkan dari perangkat lain. Coba simpan sekali lagi.')
  }
}

export function requiredFields(form: FormData, names: string[]) {
  for (const name of names) {
    const value = form.get(name)
    if (typeof value !== 'string' || value.trim() === '') return `${name} wajib diisi`
  }
  return null
}
