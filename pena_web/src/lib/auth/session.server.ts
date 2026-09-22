import type { Cookies } from '@sveltejs/kit'
import { randomBytes } from 'node:crypto'
import { env } from '$env/dynamic/private'
import { createDb } from '$lib/db/postgrest.server'

export const COOKIE_SESI = 'pena_sesi'

// Tujuh hari. Cukup lama supaya tentor tidak login ulang tiap hari mengajar,
// cukup pendek supaya sesi yang tertinggal di komputer bersama tidak abadi.
const UMUR_HARI = 7

export interface UserSesi {
  id: string
  email: string
}

function opsiCookie(maxAge: number) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    // Di HTTP polos cookie ber-flag secure tidak pernah dikirim balik browser,
    // jadi flag-nya mengikuti ORIGIN. Begitu pindah ke https, ikut menyala.
    secure: (env.ORIGIN ?? '').startsWith('https://'),
    maxAge
  }
}

export async function buatSesi(cookies: Cookies, userId: string) {
  const token = randomBytes(32).toString('hex')
  const kedaluwarsa = new Date(Date.now() + UMUR_HARI * 86_400_000)

  const { error } = await createDb()
    .from('sessions')
    .insert({ token, user_id: userId, expires_at: kedaluwarsa.toISOString() })

  if (error) throw new Error(error.message)

  cookies.set(COOKIE_SESI, token, opsiCookie(UMUR_HARI * 86_400))
}

/** User pemilik sesi, atau null. Sesi kedaluwarsa diperlakukan seperti tidak ada. */
export async function userDariSesi(cookies: Cookies): Promise<UserSesi | null> {
  const token = cookies.get(COOKIE_SESI)
  if (!token) return null

  const { data } = await createDb()
    .from('sessions')
    .select('expires_at, app_users:user_id(id, email)')
    .eq('token', token)
    .maybeSingle()

  if (!data) return null

  if (new Date(data.expires_at as string).getTime() < Date.now()) {
    await hapusSesi(cookies)
    return null
  }

  const user = data.app_users as unknown as UserSesi | null
  return user ?? null
}

export async function hapusSesi(cookies: Cookies) {
  const token = cookies.get(COOKIE_SESI)
  cookies.delete(COOKIE_SESI, { path: '/' })
  if (!token) return

  // Dihapus di database juga, bukan hanya cookie-nya: logout harus benar-benar
  // mematikan sesi, bukan sekadar melupakannya di sisi browser.
  await createDb().from('sessions').delete().eq('token', token)
}

/** Membuang sesi yang sudah lewat waktu. Dipanggil saat login, bukan lewat cron. */
export async function sapuSesiKedaluwarsa() {
  await createDb().from('sessions').delete().lt('expires_at', new Date().toISOString())
}
