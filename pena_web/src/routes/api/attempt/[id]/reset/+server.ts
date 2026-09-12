import { pesanRamah } from '$lib/utils/pesan'
import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { getSessionProfile } from '$lib/supabase/guard.server'

/**
 * Resets a try out attempt. Kepala guru only — a tentor whose try out is tagged
 * post_test has a direct stake in the score, so self-service reset would compromise
 * KPI integrity. The old attempt is kept with is_active = false; nothing is deleted.
 */
export async function POST({ cookies, params }) {
  const profile = await getSessionProfile(cookies)
  if (!profile) throw svelteError(401, 'Belum login')
  if (profile.role !== 'kepala_guru') {
    throw svelteError(403, 'Hanya kepala guru yang bisa reset attempt')
  }

  const { data: attempt } = await supabaseAdmin
    .from('attempt')
    .select('id, siswa_detail_id, try_out_id, sub_materi_id, tahun_ajaran_id, is_active')
    .eq('id', params.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!attempt) throw svelteError(404, 'Attempt tidak ditemukan')
  if (!attempt.is_active) throw svelteError(409, 'Attempt ini sudah di-reset sebelumnya')

  const { error: archiveError } = await supabaseAdmin
    .from('attempt')
    .update({ is_active: false })
    .eq('id', attempt.id)

  if (archiveError) throw svelteError(400, pesanRamah(archiveError, 'Gagal menyimpan. Coba lagi sebentar.'))

  // A fresh attempt so the student can sit the try out again. The most recent
  // active attempt is the one that counts.
  const { data: fresh, error: insertError } = await supabaseAdmin
    .from('attempt')
    .insert({
      siswa_detail_id: attempt.siswa_detail_id,
      try_out_id: attempt.try_out_id,
      sub_materi_id: attempt.sub_materi_id,
      tahun_ajaran_id: attempt.tahun_ajaran_id,
      started_at: new Date().toISOString()
    })
    .select()
    .single()

  if (insertError) throw svelteError(400, pesanRamah(insertError, 'Gagal menyimpan. Coba lagi sebentar.'))

  return json(fresh)
}
