import { redirect } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

/**
 * Logout bersama untuk sidebar. Tombol keluar ada di semua halaman, jadi ia
 * tidak bisa memakai action `?/logout` milik satu halaman dashboard.
 * Action lama di tiap dashboard sengaja dibiarkan — belum ada yang memanggil
 * endpoint ini selain AppShell.
 */
export async function POST({ cookies }) {
  const supabase = createSupabaseServerClient(cookies)
  await supabase.auth.signOut()
  throw redirect(303, '/auth/login')
}
