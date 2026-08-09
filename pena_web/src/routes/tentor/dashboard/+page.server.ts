import { redirect } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export const actions = {
  logout: async ({ cookies }) => {
    const supabase = createSupabaseServerClient(cookies)
    await supabase.auth.signOut()
    redirect(303, '/auth/login')
  }
}
