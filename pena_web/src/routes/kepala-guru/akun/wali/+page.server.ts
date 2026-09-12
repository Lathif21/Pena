import { pesanRamah } from '$lib/utils/pesan'
import { error as svelteError, fail } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import {
  isKepalaGuru,
  createAccount,
  rollbackAccount,
  updateAccountEmail,
  requiredFields
} from '$features/account/data/account.server'

export async function load({ cookies, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data: wali, error } = await supabase
    .from('profiles')
    .select('id, nama_lengkap, email, created_at, deleted_at')
    .eq('role', 'wali_murid')
    .is('deleted_at', null)
    .order('nama_lengkap')

  if (error) throw svelteError(500, pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.'))

  return { ...parentData, wali: wali ?? [] }
}

function parseSiswaIds(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== 'string' || raw.trim() === '') return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

/** One wali may cover several children, so links are replaced wholesale. */
async function setWaliSiswa(waliId: string, siswaIds: string[]) {
  const { error: clearError } = await supabaseAdmin
    .from('wali_siswa')
    .delete()
    .eq('wali_id', waliId)

  if (clearError) throw new Error(clearError.message)
  if (siswaIds.length === 0) return

  const { error: linkError } = await supabaseAdmin
    .from('wali_siswa')
    .insert(siswaIds.map((siswa_detail_id) => ({ wali_id: waliId, siswa_detail_id })))

  if (linkError) throw new Error(linkError.message)
}

export const actions = {
  create: async ({ request, cookies }) => {
    if (!(await isKepalaGuru(cookies))) return fail(403, { error: 'Tidak diizinkan' })

    const form = await request.formData()
    const missing = requiredFields(form, ['nama_lengkap', 'email', 'password', 'tahun_ajaran_id'])
    if (missing) return fail(400, { error: missing })

    const siswaIds = parseSiswaIds(form.get('siswa_ids'))

    let profileId: string
    try {
      profileId = await createAccount({
        role: 'wali_murid',
        nama_lengkap: String(form.get('nama_lengkap')).trim(),
        email: String(form.get('email')).trim(),
        password: String(form.get('password')),
        tahun_ajaran_id: String(form.get('tahun_ajaran_id'))
      })
    } catch (err) {
      return fail(400, { error: pesanRamah(err, 'Gagal membuat wali') })
    }

    try {
      await setWaliSiswa(profileId, siswaIds)
    } catch (err) {
      await rollbackAccount(profileId)
      return fail(400, { error: pesanRamah(err, 'Gagal menautkan siswa') })
    }

    return { success: true }
  },

  update: async ({ request, cookies }) => {
    if (!(await isKepalaGuru(cookies))) return fail(403, { error: 'Tidak diizinkan' })

    const form = await request.formData()
    const missing = requiredFields(form, ['wali_id', 'nama_lengkap', 'email'])
    if (missing) return fail(400, { error: missing })

    const waliId = String(form.get('wali_id'))
    const email = String(form.get('email')).trim()

    try {
      await updateAccountEmail(waliId, email)
    } catch (err) {
      return fail(400, { error: pesanRamah(err, 'Gagal memperbarui email') })
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ nama_lengkap: String(form.get('nama_lengkap')).trim(), email })
      .eq('id', waliId)
      .eq('role', 'wali_murid')

    if (error) return fail(400, { error: pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.') })

    try {
      await setWaliSiswa(waliId, parseSiswaIds(form.get('siswa_ids')))
    } catch (err) {
      return fail(400, { error: pesanRamah(err, 'Gagal menautkan siswa') })
    }

    return { success: true }
  }
}
