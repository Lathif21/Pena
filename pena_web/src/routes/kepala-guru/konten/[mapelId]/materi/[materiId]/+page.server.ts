import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

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
