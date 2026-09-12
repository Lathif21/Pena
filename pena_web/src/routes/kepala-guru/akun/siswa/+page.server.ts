import { pesanRamah } from '$lib/utils/pesan'
import { error as svelteError, fail } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { getSessionProfile } from '$lib/supabase/guard.server'
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
      siswa_detail:siswa_detail(
        id,
        nis,
        paket,
        siswa_kelas(kelas_id, deleted_at, kelas:kelas_id(id, nama)),
        tentor_siswa_privat(tentor_id, mapel_id, deleted_at)
      )
    `)
    .eq('role', 'siswa')
    .is('deleted_at', null)
    .order('nama_lengkap')

  if (error) throw svelteError(500, pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.'))

  const siswa = (data ?? []).map((profile: any) => {
    const detail = profile.siswa_detail?.[0]
    // A student can in principle hold several kelas rows; the active one is the
    // first not soft-deleted.
    const enrolment = (detail?.siswa_kelas ?? []).find((sk: any) => !sk.deleted_at)
    const tentorMapel = (detail?.tentor_siswa_privat ?? [])
      .filter((tp: any) => !tp.deleted_at)
      .map((tp: any) => ({ tentor_id: tp.tentor_id, mapel_id: tp.mapel_id }))

    return {
      id: profile.id,
      siswa_detail_id: detail?.id || '',
      nama_lengkap: profile.nama_lengkap,
      email: profile.email,
      nis: detail?.nis || '',
      paket: detail?.paket || 'regular',
      kelas_id: enrolment?.kelas_id || '',
      kelas_nama: enrolment?.kelas?.nama || '',
      tentor_mapel: tentorMapel,
      created_at: profile.created_at,
      deleted_at: profile.deleted_at
    }
  })

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

/**
 * Replaces a privat student's tentor+mapel assignments.
 *
 * tentor_siswa_privat is unique on (siswa_detail_id, tentor_id, mapel_id,
 * tahun_ajaran_id) and that constraint counts soft-deleted rows, so re-adding a
 * pairing that was removed earlier has to revive the old row rather than insert.
 */
async function setTentorMapel(
  siswaDetailId: string,
  tahunAjaranId: string,
  wanted: TentorMapel[]
) {
  const { data: rows } = await supabaseAdmin
    .from('tentor_siswa_privat')
    .select('id, tentor_id, mapel_id, deleted_at')
    .eq('siswa_detail_id', siswaDetailId)
    .eq('tahun_ajaran_id', tahunAjaranId)

  const key = (t: string, m: string) => `${t}:${m}`
  const existing = new Map((rows ?? []).map((r) => [key(r.tentor_id, r.mapel_id), r]))
  const wantedKeys = new Set(wanted.map((w) => key(w.tentor_id, w.mapel_id)))

  for (const w of wanted) {
    const row = existing.get(key(w.tentor_id, w.mapel_id))

    if (!row) {
      const { error } = await supabaseAdmin.from('tentor_siswa_privat').insert({
        siswa_detail_id: siswaDetailId,
        tentor_id: w.tentor_id,
        mapel_id: w.mapel_id,
        tahun_ajaran_id: tahunAjaranId
      })
      if (error) return error.message
    } else if (row.deleted_at) {
      const { error } = await supabaseAdmin
        .from('tentor_siswa_privat')
        .update({ deleted_at: null })
        .eq('id', row.id)
      if (error) return error.message
    }
  }

  // Anything no longer wanted is closed, not deleted — grades reference it.
  const stale = (rows ?? []).filter(
    (r) => !r.deleted_at && !wantedKeys.has(key(r.tentor_id, r.mapel_id))
  )

  if (stale.length > 0) {
    const { error } = await supabaseAdmin
      .from('tentor_siswa_privat')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', stale.map((r) => r.id))
    if (error) return error.message
  }

  return null
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
      return fail(400, { error: pesanRamah(err, 'Gagal membuat siswa') })
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
        return fail(400, { error: pesanRamah(kelasError, 'Gagal menyimpan. Coba lagi sebentar.') })
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
        return fail(400, { error: pesanRamah(privatError, 'Gagal menyimpan. Coba lagi sebentar.') })
      }
    }

    return { success: true }
  },

  update: async ({ request, cookies }) => {
    const profile = await getSessionProfile(cookies)
    if (profile?.role !== 'kepala_guru') return fail(403, { error: 'Tidak diizinkan' })

    const form = await request.formData()
    const missing = requiredFields(form, ['siswa_id', 'nama_lengkap', 'email', 'nis'])
    if (missing) return fail(400, { error: missing })

    const siswaId = String(form.get('siswa_id'))
    const email = String(form.get('email')).trim()

    try {
      await updateAccountEmail(siswaId, email)
    } catch (err) {
      return fail(400, { error: pesanRamah(err, 'Gagal memperbarui email') })
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ nama_lengkap: String(form.get('nama_lengkap')).trim(), email })
      .eq('id', siswaId)
      .eq('role', 'siswa')

    if (profileError) return fail(400, { error: pesanRamah(profileError, 'Gagal menyimpan. Coba lagi sebentar.') })

    const { data: detail, error: detailError } = await supabaseAdmin
      .from('siswa_detail')
      .update({ nis: String(form.get('nis')).trim() })
      .eq('profile_id', siswaId)
      .is('deleted_at', null)
      .select('id, paket')
      .single()

    if (detailError || !detail) {
      return fail(400, { error: detailError?.message ?? 'Detail siswa tidak ditemukan' })
    }

    // Kelas is optional on edit — only touched when the form actually sends one.
    if (form.has('kelas_id')) {
      const kelasId = String(form.get('kelas_id') ?? '')

      if (detail.paket === 'regular' && !kelasId) {
        return fail(400, { error: 'Siswa regular wajib punya kelas' })
      }

      const { data: current } = await supabaseAdmin
        .from('siswa_kelas')
        .select('id, kelas_id')
        .eq('siswa_detail_id', detail.id)
        .is('deleted_at', null)
        .maybeSingle()

      if (current?.kelas_id !== kelasId) {
        if (kelasId) {
          // siswa_kelas is unique on (siswa_detail_id, kelas_id, tahun_ajaran_id) and
          // that constraint counts soft-deleted rows, so moving a student back to a
          // kelas they left would collide. Revive the old row instead of inserting.
          const { data: previous } = await supabaseAdmin
            .from('siswa_kelas')
            .select('id')
            .eq('siswa_detail_id', detail.id)
            .eq('kelas_id', kelasId)
            .eq('tahun_ajaran_id', profile.tahun_ajaran_id)
            .maybeSingle()

          const { error: kelasError } = previous
            ? await supabaseAdmin
                .from('siswa_kelas')
                .update({ deleted_at: null })
                .eq('id', previous.id)
            : await supabaseAdmin.from('siswa_kelas').insert({
                siswa_detail_id: detail.id,
                kelas_id: kelasId,
                // The edit form sends no tahun ajaran; the active one from the
                // session is the right bucket for a move happening now.
                tahun_ajaran_id: profile.tahun_ajaran_id
              })

          // Bail before touching the old enrolment, so a failure here leaves the
          // student in the kelas they were already in rather than in none.
          if (kelasError) return fail(400, { error: pesanRamah(kelasError, 'Gagal menyimpan. Coba lagi sebentar.') })
        }

        // Soft delete the old enrolment rather than dropping it — attendance and
        // grades reference the kelas the student was in at the time.
        if (current) {
          await supabaseAdmin
            .from('siswa_kelas')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', current.id)
        }
      }
    }

    // Tentor+mapel assignments, only meaningful for privat students.
    if (detail.paket === 'privat' && form.has('tentor_mapel')) {
      const wanted = parseTentorMapel(form.get('tentor_mapel'))

      if (wanted.length === 0) {
        return fail(400, { error: 'Siswa privat wajib punya minimal satu tentor & mapel' })
      }

      const message = await setTentorMapel(detail.id, profile.tahun_ajaran_id, wanted)
      if (message) return fail(400, { error: message })
    }

    return { success: true }
  }
}
