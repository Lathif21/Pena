import { pesanRamah } from '$lib/utils/pesan'
import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { getPengajar } from '$lib/supabase/sesi.server'
import { adaSesiLewatRelief, kirimNotifikasi } from '$features/relief/data/relief.server'

/**
 * Membatalkan relief.
 *
 * Hanya tentor asli yang boleh membatalkan, dan hanya selama pengganti belum
 * membuka sesi lewat jalur ini. Membatalkan setelah sesi terbuka akan
 * meninggalkan sesi itu tanpa dasar otorisasi — presensi dan jurnalnya sudah
 * telanjur tercatat, jadi izinnya tidak bisa ditarik surut.
 */
export async function POST({ params, cookies, url }) {
  const profile = await getPengajar(cookies)

  const { data: relief } = await supabaseAdmin
    .from('relief')
    .select('*, kelas:kelas_id(nama), mapel:mapel_id(nama)')
    .eq('id', params.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!relief) throw svelteError(404, 'Relief tidak ditemukan')
  if (relief.tentor_asli_id !== profile.id) throw svelteError(403, 'Bukan relief Anda')
  if (relief.status !== 'aktif') throw svelteError(409, 'Relief sudah dibatalkan')

  if (await adaSesiLewatRelief(relief)) {
    throw svelteError(409, 'Sesi sudah dibuka, relief tidak bisa dibatalkan')
  }

  const { error } = await supabaseAdmin
    .from('relief')
    .update({ status: 'dibatalkan' })
    .eq('id', relief.id)

  if (error) throw svelteError(400, pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.'))

  const { data: pengganti } = await supabaseAdmin
    .from('profiles')
    .select('nama_lengkap, email')
    .eq('id', relief.pengganti_id)
    .maybeSingle()

  const emailError = pengganti
    ? await kirimNotifikasi('dibatalkan', relief, profile.id, pengganti, url.origin)
    : null

  return json({ emailError })
}
