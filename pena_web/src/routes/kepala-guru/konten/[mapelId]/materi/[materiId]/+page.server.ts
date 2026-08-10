import { error as svelteError, fail } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { isKepalaGuru } from '$lib/supabase/guard.server'

export async function load({ cookies, params, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data: materi, error } = await supabase
    .from('materi')
    .select('id, nama, nomor_urut, mapel_id')
    .eq('id', params.materiId)
    .is('deleted_at', null)
    .single()

  if (error || !materi) throw svelteError(404, 'Materi tidak ditemukan')

  const { data: mapel } = await supabase
    .from('mapel')
    .select('id, nama')
    .eq('id', materi.mapel_id)
    .is('deleted_at', null)
    .single()

  if (!mapel) throw svelteError(404, 'Mapel tidak ditemukan')

  return { ...parentData, materi, mapel }
}

function readSubMateriFields(form: FormData) {
  const nama = String(form.get('nama') ?? '').trim()
  const nomorUrut = Number(form.get('nomor_urut'))

  if (!nama) return { error: 'Nama sub materi wajib diisi' as const }
  if (!Number.isInteger(nomorUrut) || nomorUrut < 1) {
    return { error: 'Nomor urut harus berupa angka mulai dari 1' as const }
  }

  return { nama, nomorUrut }
}

/** nomor_urut is unique per materi (idx_unique_sub_materi_per_materi). */
function subMateriError(error: { code?: string; message: string }) {
  return error.code === '23505' ? 'Nomor urut ini sudah dipakai sub materi lain' : error.message
}

export const actions = {
  create: async ({ request, cookies, params }) => {
    if (!(await isKepalaGuru(cookies))) return fail(403, { error: 'Tidak diizinkan' })

    const form = await request.formData()
    const fields = readSubMateriFields(form)
    if ('error' in fields) return fail(400, { error: fields.error })

    // Trust the route param over the posted materi_id — the URL is what the guard saw.
    const supabase = createSupabaseServerClient(cookies)
    const { error } = await supabase.from('sub_materi').insert({
      materi_id: params.materiId,
      nama: fields.nama,
      nomor_urut: fields.nomorUrut
    })

    if (error) return fail(400, { error: subMateriError(error) })

    return { success: true }
  },

  update: async ({ request, cookies, params }) => {
    if (!(await isKepalaGuru(cookies))) return fail(403, { error: 'Tidak diizinkan' })

    const form = await request.formData()
    const subMateriId = String(form.get('sub_materi_id') ?? '')
    if (!subMateriId) return fail(400, { error: 'Sub materi tidak ditemukan' })

    const fields = readSubMateriFields(form)
    if ('error' in fields) return fail(400, { error: fields.error })

    const supabase = createSupabaseServerClient(cookies)
    const { error } = await supabase
      .from('sub_materi')
      .update({ nama: fields.nama, nomor_urut: fields.nomorUrut })
      .eq('id', subMateriId)
      .eq('materi_id', params.materiId)
      .is('deleted_at', null)

    if (error) return fail(400, { error: subMateriError(error) })

    return { success: true }
  }
}
