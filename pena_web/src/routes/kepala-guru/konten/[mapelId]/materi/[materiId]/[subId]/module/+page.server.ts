import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, params, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data: subMateri, error } = await supabase
    .from('sub_materi')
    .select('id, nama, nomor_urut, materi_id')
    .eq('id', params.subId)
    .is('deleted_at', null)
    .single()

  if (error || !subMateri) throw svelteError(404, 'Sub materi tidak ditemukan')

  const { data: materi } = await supabase
    .from('materi')
    .select('id, nama, mapel_id')
    .eq('id', subMateri.materi_id)
    .is('deleted_at', null)
    .single()

  const { data: mapel } = await supabase
    .from('mapel')
    .select('id, nama')
    .eq('id', materi?.mapel_id ?? '')
    .is('deleted_at', null)
    .single()

  return { ...parentData, subMateri, materi, mapel }
}
