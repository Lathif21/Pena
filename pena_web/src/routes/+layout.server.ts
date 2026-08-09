import { redirect } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, url }) {
  const supabase = createSupabaseServerClient(cookies)

  try {
    const { data: { user } } = await supabase.auth.getUser()

    // Allow auth routes without checking for user
    if (url.pathname.startsWith('/auth/')) {
      return { user }
    }

    // Redirect unauthenticated users to login
    if (!user && !url.pathname.startsWith('/auth/')) {
      throw redirect(303, '/auth/login')
    }

    return { user }
  } catch (err) {
    if (err instanceof Error && 'status' in err && err.status === 303) {
      throw err
    }
    return { user: null }
  }
}
