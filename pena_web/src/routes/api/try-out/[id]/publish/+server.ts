import { pesanRamah } from '$lib/utils/pesan'
import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { isKepalaGuru } from '$lib/supabase/guard.server'

/** Publishes a try out. Refuses if it has no soal — an empty try out cannot be graded. */
export async function POST({ cookies, params }) {
  if (!(await isKepalaGuru(cookies))) throw svelteError(403, 'Tidak diizinkan')

  const { data: tryOut } = await supabaseAdmin
    .from('try_out')
    .select('id, status')
    .eq('id', params.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!tryOut) throw svelteError(404, 'Try out tidak ditemukan')
  if (tryOut.status === 'published') throw svelteError(409, 'Try out sudah dipublish')

  const { data: soal } = await supabaseAdmin
    .from('soal')
    .select('id')
    .eq('try_out_id', tryOut.id)
    .is('deleted_at', null)
    .limit(1)

  if ((soal ?? []).length === 0) {
    throw svelteError(400, 'Try out harus memiliki minimal 1 soal')
  }

  const { data: kelas } = await supabaseAdmin
    .from('try_out_kelas')
    .select('kelas_id')
    .eq('try_out_id', params.id)
    .limit(1)

  if ((kelas ?? []).length === 0) {
    throw svelteError(400, 'Try out harus punya minimal 1 kelas target')
  }

  const { error } = await supabaseAdmin
    .from('try_out')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) throw svelteError(400, pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.'))

  return json({ published: true })
}
