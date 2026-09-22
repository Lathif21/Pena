import { json, error, type RequestEvent } from '@sveltejs/kit'
import { getSessionProfile, type SessionProfile } from '$lib/supabase/guard.server'

type Handler = (args: unknown[], profil: SessionProfile) => Promise<unknown>
export type Handlers = Record<string, Handler>

/**
 * Membungkus sekumpulan fungsi data jadi satu endpoint POST.
 *
 * Fungsi-fungsi ini dulu dipanggil browser langsung ke Supabase memakai anon
 * key. Karena tabelnya tidak memakai RLS, siapa pun yang membaca anon key dari
 * bundle JS bisa ikut membaca dan menulis — termasuk kunci jawaban di
 * `pilihan_jawaban.is_benar`. Sekarang panggilannya berhenti di server, dan
 * peran pemanggil diperiksa di sini sebelum query mana pun jalan.
 *
 * Perannya diambil ulang dari database tiap panggilan, tidak pernah dari yang
 * dikirim klien.
 */
export function buatEndpoint(handlers: Handlers, peranBoleh: SessionProfile['role'][]) {
  return async function POST({ request, cookies }: RequestEvent) {
    const profil = await getSessionProfile(cookies)
    if (!profil) throw error(401, 'Belum masuk')
    if (!peranBoleh.includes(profil.role)) throw error(403, 'Tidak berhak')

    let body: { aksi?: string; args?: unknown[] }
    try {
      body = await request.json()
    } catch {
      throw error(400, 'Body bukan JSON')
    }

    const handler = body.aksi ? handlers[body.aksi] : undefined
    // Dicocokkan ke daftar handler, bukan diambil dinamis dari objek apa pun,
    // supaya nama seperti "constructor" tidak pernah bisa dipanggil.
    if (!handler || !Object.hasOwn(handlers, body.aksi as string)) {
      throw error(404, 'Aksi tidak dikenal')
    }

    try {
      return json({ data: await handler(body.args ?? [], profil) })
    } catch (e) {
      throw error(400, (e as Error).message || 'Gagal memproses permintaan')
    }
  }
}
