import { pesanRamah } from '$lib/utils/pesan'
import { error as svelteError, fail } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { isKepalaGuru } from '$lib/supabase/guard.server'

export async function load({ cookies, params, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data: subMateri, error } = await supabase
    .from('sub_materi')
    .select('id, nama, nomor_urut, materi_id')
    .eq('id', params.subId)
    .is('deleted_at', null)
    .single()

  if (error || !subMateri) throw svelteError(404, 'Sub materi tidak ditemukan')

  const { data: materi } = await supabase
    .from('materi')
    .select('id, nama, mapel_id')
    .eq('id', subMateri.materi_id)
    .is('deleted_at', null)
    .single()

  const { data: mapel } = await supabase
    .from('mapel')
    .select('id, nama')
    .eq('id', materi?.mapel_id ?? '')
    .is('deleted_at', null)
    .single()

  return { ...parentData, subMateri, materi, mapel }
}

/**
 * Only kepala_guru may change publish state. There is no RLS on `module`, so this
 * check is the enforcement — not the layout guard, which form actions bypass.
 */
async function setStatus(cookies: Parameters<typeof isKepalaGuru>[0], subId: string, publish: boolean) {
  if (!(await isKepalaGuru(cookies))) return fail(403, { error: 'Tidak diizinkan' })

  const supabase = createSupabaseServerClient(cookies)
  const { data: modul } = await supabase
    .from('module')
    .select('id, status')
    .eq('sub_materi_id', subId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!modul) return fail(404, { error: 'Modul tidak ditemukan' })
  if (modul.status === (publish ? 'published' : 'draft')) {
    return fail(400, { error: publish ? 'Modul sudah dipublish' : 'Modul masih draft' })
  }

  const { error } = await supabase
    .from('module')
    .update({
      status: publish ? 'published' : 'draft',
      published_at: publish ? new Date().toISOString() : null
    })
    .eq('id', modul.id)

  if (error) return fail(400, { error: pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.') })

  return { success: true }
}

export const actions = {
  publish: async ({ cookies, params }) => setStatus(cookies, params.subId, true),

  // Unpublish pulls the modul back to draft so KG can replace the PDF. The file on
  // disk is kept — replacing it is a separate upload that overwrites storage_path.
  unpublish: async ({ cookies, params }) => setStatus(cookies, params.subId, false)
}
