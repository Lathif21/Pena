import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data: tentor, error } = await supabase
    .from('profiles')
    .select('id, nama_lengkap, email, created_at, deleted_at')
    .eq('role', 'tentor')
    .is('deleted_at', null)
    .order('nama_lengkap')

  if (error) throw svelteError(500, error.message)

  return { ...parentData, tentor: tentor ?? [] }
}
