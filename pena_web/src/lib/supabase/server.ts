import type { Cookies } from '@sveltejs/kit'
import { createServerClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

/**
 * Satu client per request, bukan satu per pemanggil.
 *
 * Sebelumnya tiap load dan action membuat client sendiri, jadi satu request ke
 * /kepala-guru/dashboard menghasilkan tiga client — root layout, layout peran,
 * dan page — yang masing-masing memegang sesi sendiri dan me-refresh token yang
 * sama secara berbarengan.
 *
 * Refresh token Supabase berotasi: sekali dipakai, yang lama mati. Client yang
 * menang lomba merotasi token, dan sisanya menerima "refresh_token_not_found"
 * meski sesinya sah — user valid terlempar ke halaman login tanpa sebab.
 *
 * Kuncinya objek `cookies`, yang SvelteKit buat sekali per request dan berikan
 * ke seluruh load, action, dan endpoint request itu. Kalau suatu saat identitas
 * itu tidak lagi sama, memo hanya meleset dan kita kembali ke perilaku lama —
 * bukan rusak.
 */
const perRequest = new WeakMap<Cookies, ReturnType<typeof createServerClient>>()

export function createSupabaseServerClient(cookies: Cookies) {
  const sudahAda = perRequest.get(cookies)
  if (sudahAda) return sudahAda

  const client = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options)
        })
      }
    }
  })

  perRequest.set(cookies, client)
  return client
}
