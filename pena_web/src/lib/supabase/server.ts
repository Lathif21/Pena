import type { Cookies } from '@sveltejs/kit'
import { createDb } from '$lib/db/postgrest.server'
import { verifyPassword } from '$lib/auth/password.server'
import { buatSesi, hapusSesi, userDariSesi, sapuSesiKedaluwarsa } from '$lib/auth/session.server'

/**
 * Satu client per request, bukan satu per pemanggil.
 *
 * Bentuk objeknya sengaja dipertahankan sama seperti waktu memakai Supabase —
 * `.from()`, `.rpc()`, dan `.auth` dengan tiga method yang benar-benar dipakai —
 * supaya 50-an load dan action yang memanggilnya tidak perlu diubah satu pun
 * saat backend-nya berpindah ke PostgreSQL sendiri.
 *
 * Yang berubah hanya isinya: query lewat PostgREST di loopback, dan sesi
 * disimpan di tabel `sessions`, bukan JWT Supabase.
 */
const perRequest = new WeakMap<Cookies, ReturnType<typeof bangunClient>>()

function bangunClient(cookies: Cookies) {
  const db = createDb()

  return Object.assign(db, {
    auth: {
      /** Bentuk balasannya menyamai supabase-js supaya pemanggil lama tetap jalan. */
      async getUser() {
        const user = await userDariSesi(cookies)
        return { data: { user }, error: null }
      },

      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const { data: user } = await db
          .from('app_users')
          .select('id, email, password_hash')
          .ilike('email', email)
          .maybeSingle()

        // Password tetap diverifikasi walau user tidak ada, memakai hash palsu,
        // supaya lama balasan tidak membocorkan email mana yang terdaftar.
        const hash = (user?.password_hash as string) ?? 'scrypt$16384$8$1$00$00'
        const cocok = await verifyPassword(password, hash)

        if (!user || !cocok) {
          return { data: { user: null }, error: { message: 'Email atau password salah' } }
        }

        await sapuSesiKedaluwarsa()
        await buatSesi(cookies, user.id as string)

        return { data: { user: { id: user.id as string, email: user.email as string } }, error: null }
      },

      async signOut() {
        await hapusSesi(cookies)
        return { error: null }
      }
    }
  })
}

export function createSupabaseServerClient(cookies: Cookies) {
  const sudahAda = perRequest.get(cookies)
  if (sudahAda) return sudahAda

  const client = bangunClient(cookies)
  perRequest.set(cookies, client)
  return client
}
