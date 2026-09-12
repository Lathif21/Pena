import { fail } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { getSessionProfile } from '$lib/supabase/guard.server'
import { hariIni } from '$lib/utils/tanggal'

export async function load({ cookies, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  // Seluruh riwayat, bukan hanya yang berlaku: kepala guru perlu melihat bobot
  // mana yang dipakai periode mana, karena skor lampau memang dihitung dengan
  // bobot saat itu.
  const { data: riwayat } = await supabase
    .from('kpi_config')
    .select('id, bobot_gain, bobot_jurnal, periode, valid_from, created_at')
    .eq('tahun_ajaran_id', parentData.profile.tahun_ajaran_id)
    .is('deleted_at', null)
    .order('valid_from', { ascending: false })

  return { ...parentData, riwayat: riwayat ?? [], hariIni: hariIni() }
}

export const actions = {
  simpan: async ({ request, cookies }) => {
    const profile = await getSessionProfile(cookies)
    if (profile?.role !== 'kepala_guru') return fail(403, { error: 'Tidak diizinkan' })

    const form = await request.formData()
    const gain = Number(form.get('bobot_gain'))
    const jurnal = Number(form.get('bobot_jurnal'))
    const periode = String(form.get('periode') ?? '')

    if (!Number.isInteger(gain) || !Number.isInteger(jurnal) || gain < 0 || jurnal < 0) {
      return fail(400, { error: 'Bobot harus bilangan bulat tidak negatif' })
    }
    if (gain + jurnal !== 100) {
      return fail(400, { error: `Bobot harus berjumlah 100, sekarang ${gain + jurnal}` })
    }
    if (periode !== 'bulanan' && periode !== 'semesteran') {
      return fail(400, { error: 'Periode tidak valid' })
    }

    // Baris baru dengan valid_from hari ini, bukan menimpa yang lama. Menimpa
    // akan mengubah skor periode lampau setiap kali bobot disesuaikan.
    const { error } = await supabaseAdmin.from('kpi_config').insert({
      bobot_gain: gain,
      bobot_jurnal: jurnal,
      periode,
      valid_from: hariIni(),
      tahun_ajaran_id: profile.tahun_ajaran_id
    })

    if (error) return fail(400, { error: error.message })

    return { success: true }
  }
}
