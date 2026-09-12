import { pesanRamah } from '$lib/utils/pesan'
import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { isKepalaGuru } from '$lib/supabase/guard.server'
import {
  validatePilihan,
  nextNomorUrut,
  replacePilihan,
  tryOutSoalLock
} from '$features/question/data/soal.server'

/** Creates a soal under a sub materi (latihan) or materi (try out). Kepala guru only. */
export async function POST({ request, cookies }) {
  if (!(await isKepalaGuru(cookies))) throw svelteError(403, 'Tidak diizinkan')

  const { parentId, parentType, pertanyaan, pilihan } = await request.json().catch(() => ({}))

  if (parentType !== 'sub_materi' && parentType !== 'try_out') {
    throw svelteError(400, 'parentType harus sub_materi atau try_out')
  }
  if (!parentId) throw svelteError(400, 'Induk soal tidak dikenali. Muat ulang halaman lalu coba lagi.')
  if (!pertanyaan?.trim()) throw svelteError(400, 'Pertanyaan wajib diisi')

  const invalid = validatePilihan(pilihan)
  if (invalid) throw svelteError(400, invalid)

  if (parentType === 'try_out') {
    // Adding a question changes the denominator for anyone mid-attempt.
    const lock = await tryOutSoalLock(parentId)
    if (lock.locked) throw svelteError(409, lock.reason)
  }

  const column = parentType === 'sub_materi' ? 'sub_materi_id' : 'try_out_id'

  const { data: soal, error } = await supabaseAdmin
    .from('soal')
    .insert({
      [column]: parentId,
      pertanyaan: pertanyaan.trim(),
      nomor_urut: await nextNomorUrut(column, parentId)
    })
    .select()
    .single()

  if (error) throw svelteError(400, pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.'))

  try {
    await replacePilihan(soal.id, pilihan)
  } catch (err) {
    // A soal with no choices is unusable — roll it back rather than leave it half-made.
    await supabaseAdmin.from('soal').delete().eq('id', soal.id)
    throw svelteError(400, pesanRamah(err, 'Gagal menyimpan pilihan'))
  }

  return json(soal)
}
