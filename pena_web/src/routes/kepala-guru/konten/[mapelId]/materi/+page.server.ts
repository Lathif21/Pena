import { error as svelteError, fail } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { isKepalaGuru } from '$lib/supabase/guard.server'

export async function load({ cookies, params, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data: mapel, error } = await supabase
    .from('mapel')
    .select('id, nama')
    .eq('id', params.mapelId)
    .is('deleted_at', null)
    .single()

  if (error || !mapel) throw svelteError(404, 'Mapel tidak ditemukan')

  return { ...parentData, mapel }
}

/** Shared by create and update — nomor_urut drives display order, so it must be a number. */
function readMateriFields(form: FormData) {
  const nama = String(form.get('nama') ?? '').trim()
  const nomorUrut = Number(form.get('nomor_urut'))

  if (!nama) return { error: 'Nama materi wajib diisi' as const }
  if (!Number.isInteger(nomorUrut) || nomorUrut < 1) {
    return { error: 'Nomor urut harus berupa angka mulai dari 1' as const }
  }

  return { nama, nomorUrut }
}

/** nomor_urut is unique per mapel (idx_unique_materi_per_mapel) — say so in Indonesian. */
function materiError(error: { code?: string; message: string }) {
  return error.code === '23505' ? 'Nomor urut ini sudah dipakai materi lain' : error.message
}

export const actions = {
  create: async ({ request, cookies, params }) => {
    if (!(await isKepalaGuru(cookies))) return fail(403, { error: 'Tidak diizinkan' })

    const form = await request.formData()
    const fields = readMateriFields(form)
    if ('error' in fields) return fail(400, { error: fields.error })

    // Trust the route param over the posted mapel_id — the URL is what the guard saw.
    const supabase = createSupabaseServerClient(cookies)
    const { error } = await supabase.from('materi').insert({
      mapel_id: params.mapelId,
      nama: fields.nama,
      nomor_urut: fields.nomorUrut
    })

    if (error) return fail(400, { error: materiError(error) })

    return { success: true }
  },

  update: async ({ request, cookies, params }) => {
    if (!(await isKepalaGuru(cookies))) return fail(403, { error: 'Tidak diizinkan' })

    const form = await request.formData()
    const materiId = String(form.get('materi_id') ?? '')
    if (!materiId) return fail(400, { error: 'Materi tidak ditemukan' })

    const fields = readMateriFields(form)
    if ('error' in fields) return fail(400, { error: fields.error })

    const supabase = createSupabaseServerClient(cookies)
    const { error } = await supabase
      .from('materi')
      .update({ nama: fields.nama, nomor_urut: fields.nomorUrut })
      .eq('id', materiId)
      .eq('mapel_id', params.mapelId)
      .is('deleted_at', null)

    if (error) return fail(400, { error: materiError(error) })

    return { success: true }
  }
}
