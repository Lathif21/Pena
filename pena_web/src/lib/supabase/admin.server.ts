import { createDb } from '$lib/db/postgrest.server'

/**
 * Akses database tanpa batasan, untuk kode server yang sudah memverifikasi
 * peran pemanggilnya sendiri. Namanya dipertahankan supaya 90-an file yang
 * memakainya tidak perlu diubah saat pindah dari Supabase ke PostgreSQL.
 *
 * Tidak ada lagi service_role key: PostgREST di loopback tidak memakai kunci
 * sama sekali. Suffix `.server.ts` tetap dipakai supaya SvelteKit menolak
 * mengimpornya dari kode browser.
 */
export const supabaseAdmin = createDb()
