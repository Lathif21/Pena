import { pesanRamah } from '$lib/utils/pesan'
import { error as svelteError, fail } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import {
  isKepalaGuru,
  createAccount,
  updateAccountEmail,
  resetAccountPassword,
  requiredFields
} from '$features/account/data/account.server'

export async function load({ cookies, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data: tentor, error } = await supabase
    .from('profiles')
    .select('id, nama_lengkap, email, created_at, deleted_at')
    .eq('role', 'tentor')
    .is('deleted_at', null)
    .order('nama_lengkap')

  if (error) throw svelteError(500, pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.'))

  return { ...parentData, tentor: tentor ?? [] }
}

export const actions = {
  create: async ({ request, cookies }) => {
    if (!(await isKepalaGuru(cookies))) return fail(403, { error: 'Tidak diizinkan' })

    const form = await request.formData()
    const missing = requiredFields(form, ['nama_lengkap', 'email', 'password', 'tahun_ajaran_id'])
    if (missing) return fail(400, { error: missing })

    try {
      await createAccount({
        role: 'tentor',
        nama_lengkap: String(form.get('nama_lengkap')).trim(),
        email: String(form.get('email')).trim(),
        password: String(form.get('password')),
        tahun_ajaran_id: String(form.get('tahun_ajaran_id'))
      })
    } catch (err) {
      return fail(400, { error: pesanRamah(err, 'Gagal membuat tentor') })
    }

    return { success: true }
  },

  update: async ({ request, cookies }) => {
    if (!(await isKepalaGuru(cookies))) return fail(403, { error: 'Tidak diizinkan' })

    const form = await request.formData()
    const missing = requiredFields(form, ['tentor_id', 'nama_lengkap', 'email'])
    if (missing) return fail(400, { error: missing })

    const tentorId = String(form.get('tentor_id'))
    const email = String(form.get('email')).trim()

    try {
      await updateAccountEmail(tentorId, email)
    } catch (err) {
      return fail(400, { error: pesanRamah(err, 'Gagal memperbarui email') })
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ nama_lengkap: String(form.get('nama_lengkap')).trim(), email })
      .eq('id', tentorId)
      .eq('role', 'tentor')

    if (error) return fail(400, { error: pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.') })

    return { success: true }
  },

  resetPassword: async ({ request, cookies }) => {
    if (!(await isKepalaGuru(cookies))) return fail(403, { error: 'Tidak diizinkan' })

    const form = await request.formData()

    try {
      await resetAccountPassword(String(form.get('profile_id') ?? ''), 'tentor', String(form.get('password') ?? ''))
    } catch (err) {
      return fail(400, { error: pesanRamah(err, 'Gagal mengganti password tentor') })
    }

    return { success: true }
  }
}
