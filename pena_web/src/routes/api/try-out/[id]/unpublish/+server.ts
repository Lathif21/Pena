import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { isKepalaGuru } from '$lib/supabase/guard.server'

/**
 * Pulls a try out back to draft so KG can fix its soal.
 *
 * Refused once the window has closed: at that point students have sat it and the
 * results are real, so editing the questions would rewrite history. Before the
 * window closes nothing is final yet, so revision is allowed.
 */
export async function POST({ cookies, params }) {
  if (!(await isKepalaGuru(cookies))) throw svelteError(403, 'Tidak diizinkan')

  const { data: tryOut } = await supabaseAdmin
    .from('try_out')
    .select('id, status, waktu_buka, durasi_menit')
    .eq('id', params.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!tryOut) throw svelteError(404, 'Try out tidak ditemukan')
  if (tryOut.status !== 'published') throw svelteError(409, 'Try out masih draft')

  const tutup = new Date(tryOut.waktu_buka).getTime() + tryOut.durasi_menit * 60000
  if (Date.now() > tutup) {
    throw svelteError(409, 'Waktu try out sudah lewat — tidak bisa dibatalkan lagi')
  }

  const { error } = await supabaseAdmin
    .from('try_out')
    .update({ status: 'draft', published_at: null })
    .eq('id', params.id)

  if (error) throw svelteError(400, error.message)

  return json({ unpublished: true })
}
