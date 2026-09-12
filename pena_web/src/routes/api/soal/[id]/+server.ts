import { pesanRamah } from '$lib/utils/pesan'
import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { isKepalaGuru } from '$lib/supabase/guard.server'
import { validatePilihan, soalLock, replacePilihan } from '$features/question/data/soal.server'

export async function PATCH({ request, cookies, params }) {
  if (!(await isKepalaGuru(cookies))) throw svelteError(403, 'Tidak diizinkan')

  const lock = await soalLock(params.id)
  if (lock === null) throw svelteError(404, 'Soal tidak ditemukan')
  if (lock.locked) throw svelteError(409, lock.reason)

  const { pertanyaan, pilihan } = await request.json().catch(() => ({}))
  if (!pertanyaan?.trim()) throw svelteError(400, 'Pertanyaan wajib diisi')

  const invalid = validatePilihan(pilihan)
  if (invalid) throw svelteError(400, invalid)

  const { error } = await supabaseAdmin
    .from('soal')
    .update({ pertanyaan: pertanyaan.trim() })
    .eq('id', params.id)

  if (error) throw svelteError(400, pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.'))

  await replacePilihan(params.id, pilihan)

  return json({ updated: true })
}

export async function DELETE({ cookies, params }) {
  if (!(await isKepalaGuru(cookies))) throw svelteError(403, 'Tidak diizinkan')

  const lock = await soalLock(params.id)
  if (lock === null) throw svelteError(404, 'Soal tidak ditemukan')
  if (lock.locked) throw svelteError(409, lock.reason)

  // Soft delete: an attempt may already reference this soal.
  const { error } = await supabaseAdmin
    .from('soal')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) throw svelteError(400, pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.'))

  return json({ deleted: true })
}
