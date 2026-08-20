import { error as svelteError } from '@sveltejs/kit'
import type { Cookies } from '@sveltejs/kit'
import { supabaseAdmin } from './admin.server'
import { getSessionProfile } from './guard.server'

/**
 * Kepemilikan sesi dipakai oleh tiga endpoint (presensi murid, jurnal, close),
 * jadi tinggal di lib/ — sebuah feature tidak boleh mengimpor isi feature lain.
 *
 * Tidak ada RLS di proyek ini: pemeriksaan di sinilah satu-satunya yang menahan
 * seorang tentor menulis ke sesi milik tentor lain.
 */

/** Tentor atau kepala guru — KG juga mengajar, jadi lolos lewat jalur yang sama. */
export async function getPengajar(cookies: Cookies) {
  const profile = await getSessionProfile(cookies)
  if (!profile) throw svelteError(401, 'Belum login')
  if (profile.role !== 'tentor' && profile.role !== 'kepala_guru') {
    throw svelteError(403, 'Tidak diizinkan')
  }
  return profile
}

/** Tentor benar-benar mengajar kelas+mapel ini — klaim peran saja bukan otorisasi. */
export async function mengajarKelasMapel(tentorId: string, kelasId: string, mapelId: string) {
  const { data } = await supabaseAdmin
    .from('tentor_kelas_mapel')
    .select('id')
    .eq('tentor_id', tentorId)
    .eq('kelas_id', kelasId)
    .eq('mapel_id', mapelId)
    .is('deleted_at', null)
    .limit(1)

  return (data ?? []).length > 0
}

/**
 * Sesi yang benar-benar milik pemanggil. `harusOpen` dipakai oleh presensi murid
 * dan jurnal, yang keduanya terkunci begitu sesi ditutup.
 */
export async function sesiMilikPemanggil(
  cookies: Cookies,
  sesiId: string,
  { harusOpen = false }: { harusOpen?: boolean } = {}
) {
  const profile = await getPengajar(cookies)

  const { data: sesi } = await supabaseAdmin
    .from('sesi_mengajar')
    .select('id, tentor_id, kelas_id, mapel_id, status, tahun_ajaran_id')
    .eq('id', sesiId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!sesi) throw svelteError(404, 'Sesi tidak ditemukan')
  if (sesi.tentor_id !== profile.id) throw svelteError(403, 'Bukan sesi Anda')
  if (harusOpen && sesi.status !== 'open') throw svelteError(409, 'Sesi sudah ditutup')

  return { profile, sesi }
}
