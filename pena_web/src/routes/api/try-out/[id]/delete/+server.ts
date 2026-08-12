import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { isKepalaGuru } from '$lib/supabase/guard.server'

/**
 * Soft-deletes a try out together with its soal.
 *
 * Refused in three cases, each protecting something already real:
 *  - published: unpublish first, so it cannot vanish from under a student mid-window
 *  - window already closed: the results are history
 *  - any attempt exists: deleting would strand a student's score
 *
 * Nothing is ever hard-deleted — deleted_at is set, and the rows stay for the
 * tahun ajaran archive.
 */
export async function POST({ cookies, params }) {
  if (!(await isKepalaGuru(cookies))) throw svelteError(403, 'Tidak diizinkan')

  const { data: tryOut } = await supabaseAdmin
    .from('try_out')
    .select('id, judul, status, waktu_buka, durasi_menit')
    .eq('id', params.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!tryOut) throw svelteError(404, 'Try out tidak ditemukan')

  const tutup = new Date(tryOut.waktu_buka).getTime() + tryOut.durasi_menit * 60000

  if (tryOut.status === 'published' && Date.now() > tutup) {
    throw svelteError(409, 'Try out sudah selesai — tidak bisa dihapus')
  }
  if (tryOut.status === 'published') {
    throw svelteError(409, 'Batalkan publish try out dulu sebelum menghapus')
  }

  // Any attempt at all, including ones archived by a reset.
  const { data: attempts } = await supabaseAdmin
    .from('attempt')
    .select('id')
    .eq('try_out_id', params.id)
    .is('deleted_at', null)
    .limit(1)

  if ((attempts ?? []).length > 0) {
    throw svelteError(409, 'Sudah ada siswa yang mengerjakan — try out tidak bisa dihapus')
  }

  const now = new Date().toISOString()

  // Soal belong to this try out, so they go with it rather than lingering parentless.
  const { error: soalError } = await supabaseAdmin
    .from('soal')
    .update({ deleted_at: now })
    .eq('try_out_id', params.id)
    .is('deleted_at', null)

  if (soalError) throw svelteError(400, soalError.message)

  const { error } = await supabaseAdmin
    .from('try_out')
    .update({ deleted_at: now })
    .eq('id', params.id)

  if (error) throw svelteError(400, error.message)

  return json({ deleted: true })
}
