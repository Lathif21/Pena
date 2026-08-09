import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()
  const tentorId = parentData.user.id

  const { data: assignments, error } = await supabase
    .from('tentor_kelas_mapel')
    .select('mapel_id')
    .eq('tentor_id', tentorId)
    .is('deleted_at', null)

  if (error) throw svelteError(500, error.message)

  const mapelIds = [...new Set((assignments ?? []).map(a => a.mapel_id))]

  let mapel: any[] = []
  if (mapelIds.length > 0) {
    const { data } = await supabase
      .from('mapel')
      .select('id, nama')
      .in('id', mapelIds)
      .is('deleted_at', null)
      .order('nama')
    mapel = data ?? []
  }

  return { ...parentData, mapel, tentorId }
}
