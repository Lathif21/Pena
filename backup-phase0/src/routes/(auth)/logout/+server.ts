import { redirect } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function POST({ cookies }) {
  const supabase = createSupabaseServerClient(cookies)
  await supabase.auth.signOut()
  throw redirect(303, '/login')
}
