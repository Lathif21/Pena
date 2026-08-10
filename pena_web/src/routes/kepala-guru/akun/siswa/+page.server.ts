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

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      nama_lengkap,
      email,
      created_at,
      deleted_at,
      siswa_detail:siswa_detail(id, nis, paket)
    `)
    .eq('role', 'siswa')
    .is('deleted_at', null)
    .order('nama_lengkap')

  if (error) throw svelteError(500, error.message)

  const siswa = (data ?? []).map((profile: any) => ({
    id: profile.id,
    siswa_detail_id: profile.siswa_detail?.[0]?.id || '',
    nama_lengkap: profile.nama_lengkap,
    email: profile.email,
    nis: profile.siswa_detail?.[0]?.nis || '',
    paket: profile.siswa_detail?.[0]?.paket || 'regular',
    created_at: profile.created_at,
    deleted_at: profile.deleted_at
  }))

  return { ...parentData, siswa }
}

interface TentorMapel {
  tentor_id: string
  mapel_id: string
}

function parseTentorMapel(raw: FormDataEntryValue | null): TentorMapel[] {
  if (typeof raw !== 'string' || raw.trim() === '') return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (row): row is TentorMapel =>
        !!row && typeof row.tentor_id === 'string' && typeof row.mapel_id === 'string'
    )
  } catch {
    return []
  }
}

export const actions = {
  create: async ({ request, cookies }) => {
    if (!(await isKepalaGuru(cookies))) return fail(403, { error: 'Tidak diizinkan' })

    const form = await request.formData()
    const missing = requiredFields(form, [
      'nama_lengkap',
      'email',
      'password',
      'nis',
      'paket',
      'tahun_ajaran_id'
    ])
    if (missing) return fail(400, { error: missing })

    const paket = String(form.get('paket'))
    if (paket !== 'regular' && paket !== 'privat') {
      return fail(400, { error: 'Paket tidak valid' })
    }

    const tahunAjaranId = String(form.get('tahun_ajaran_id'))
    const kelasId = String(form.get('kelas_id') ?? '')
    const tentorMapel = parseTentorMapel(form.get('tentor_mapel'))

    // A regular student without a kelas would see no content at all, and a privat
    // student without a tentor has no one teaching them. Reject before creating a user.
    if (paket === 'regular' && !kelasId) {
      return fail(400, { error: 'Siswa regular wajib punya kelas' })
    }
    if (paket === 'privat' && tentorMapel.length === 0) {
      return fail(400, { error: 'Siswa privat wajib punya minimal satu tentor & mapel' })
    }

    let profileId: string
    try {
      profileId = await createAccount({
        role: 'siswa',
        nama_lengkap: String(form.get('nama_lengkap')).trim(),
        email: String(form.get('email')).trim(),
        password: String(form.get('password')),
        tahun_ajaran_id: tahunAjaranId
      })
    } catch (err) {
      return fail(400, { error: err instanceof Error ? err.message : 'Gagal membuat siswa' })
    }

    const { data: detail, error: detailError } = await supabaseAdmin
      .from('siswa_detail')
      .insert({ profile_id: profileId, nis: String(form.get('nis')).trim(), paket })
      .select('id')
      .single()

    if (detailError || !detail) {
      await rollbackAccount(profileId)
      return fail(400, { error: detailError?.message ?? 'Gagal membuat detail siswa' })
    }

    if (paket === 'regular') {
      const { error: kelasError } = await supabaseAdmin.from('siswa_kelas').insert({
        siswa_detail_id: detail.id,
        kelas_id: kelasId,
        tahun_ajaran_id: tahunAjaranId
      })

      if (kelasError) {
        await supabaseAdmin.from('siswa_detail').delete().eq('id', detail.id)
        await rollbackAccount(profileId)
        return fail(400, { error: kelasError.message })
      }
    } else {
      const { error: privatError } = await supabaseAdmin.from('tentor_siswa_privat').insert(
        tentorMapel.map((tm) => ({
          siswa_detail_id: detail.id,
          tentor_id: tm.tentor_id,
          mapel_id: tm.mapel_id,
          tahun_ajaran_id: tahunAjaranId
        }))
      )

      if (privatError) {
        await supabaseAdmin.from('siswa_detail').delete().eq('id', detail.id)
        await rollbackAccount(profileId)
        return fail(400, { error: privatError.message })
      }
    }

    return { success: true }
  },

  update: async ({ request, cookies }) => {
    if (!(await isKepalaGuru(cookies))) return fail(403, { error: 'Tidak diizinkan' })

    const form = await request.formData()
    const missing = requiredFields(form, ['siswa_id', 'nama_lengkap', 'email', 'nis'])
    if (missing) return fail(400, { error: missing })

    const siswaId = String(form.get('siswa_id'))
    const email = String(form.get('email')).trim()

    try {
      await updateAccountEmail(siswaId, email)
    } catch (err) {
      return fail(400, { error: err instanceof Error ? err.message : 'Gagal memperbarui email' })
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ nama_lengkap: String(form.get('nama_lengkap')).trim(), email })
      .eq('id', siswaId)
      .eq('role', 'siswa')

    if (profileError) return fail(400, { error: profileError.message })

    const { error: detailError } = await supabaseAdmin
      .from('siswa_detail')
      .update({ nis: String(form.get('nis')).trim() })
      .eq('profile_id', siswaId)
      .is('deleted_at', null)

    if (detailError) return fail(400, { error: detailError.message })

    return { success: true }
  }
}
