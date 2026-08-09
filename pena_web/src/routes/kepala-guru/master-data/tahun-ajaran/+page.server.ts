import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data: tahunAjaran, error } = await supabase
    .from('tahun_ajaran')
    .select('id, nama, is_active, created_at, deleted_at')
    .is('deleted_at', null)
    .order('nama', { ascending: false })

  if (error) throw svelteError(500, error.message)

  return { ...parentData, tahunAjaran: tahunAjaran ?? [] }
}
