import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data: kelas, error } = await supabase
    .from('kelas')
    .select('id, nama, created_at, deleted_at')
    .is('deleted_at', null)
    .order('nama')

  if (error) throw svelteError(500, `Gagal memuat kelas: ${error.message}`)

  return { ...parentData, kelas: kelas ?? [] }
}
