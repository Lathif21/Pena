import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

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
