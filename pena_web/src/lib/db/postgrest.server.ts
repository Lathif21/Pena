import { PostgrestClient } from '@supabase/postgrest-js'
import { env } from '$env/dynamic/private'

/**
 * Akses database lewat PostgREST yang berjalan di VPS yang sama.
 *
 * PostgREST hanya mendengar di 127.0.0.1 dan tidak pernah di-proxy Caddy, jadi
 * tidak ada kunci publik dan tidak ada jalur dari browser ke database sama
 * sekali. Ini pengganti langsung service_role key Supabase: otorisasi tetap
 * sepenuhnya di kode server, bukan di database.
 *
 * Query builder-nya paket yang sama persis dengan yang dipakai supabase-js,
 * jadi `.from(...).select(...)` dan kawan-kawannya berperilaku identik.
 */
export function createDb() {
  return new PostgrestClient(env.POSTGREST_URL ?? 'http://127.0.0.1:3001')
}

/** Tipe client-nya, untuk fungsi yang menerima koneksi sebagai argumen. */
export type Db = ReturnType<typeof createDb>
