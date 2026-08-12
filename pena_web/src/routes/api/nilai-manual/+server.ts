import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { getSessionProfile } from '$lib/supabase/guard.server'

/**
 * A tentor may only grade students they actually teach — reguler via
 * tentor_kelas_mapel, privat via tentor_siswa_privat. The role claim alone is not
 * authorization, and tentor_id comes from the session, never from the request body.
 */
async function mengajar(tentorId: string, siswaDetailId: string, mapelId: string) {
  const { data: privat } = await supabaseAdmin
    .from('tentor_siswa_privat')
    .select('id')
    .eq('tentor_id', tentorId)
    .eq('mapel_id', mapelId)
    .eq('siswa_detail_id', siswaDetailId)
    .is('deleted_at', null)
    .limit(1)

  if ((privat ?? []).length > 0) return true

  const { data: kelasMapel } = await supabaseAdmin
    .from('tentor_kelas_mapel')
    .select('kelas_id')
    .eq('tentor_id', tentorId)
    .eq('mapel_id', mapelId)
    .is('deleted_at', null)

  const kelasIds = (kelasMapel ?? []).map((k) => k.kelas_id)
  if (kelasIds.length === 0) return false

  const { data: siswaKelas } = await supabaseAdmin
    .from('siswa_kelas')
    .select('id')
    .eq('siswa_detail_id', siswaDetailId)
    .in('kelas_id', kelasIds)
    .is('deleted_at', null)
    .limit(1)

  return (siswaKelas ?? []).length > 0
}

export async function POST({ request, cookies }) {
  const profile = await getSessionProfile(cookies)
  if (!profile) throw svelteError(401, 'Belum login')
  if (profile.role !== 'tentor' && profile.role !== 'kepala_guru') {
    throw svelteError(403, 'Tidak diizinkan')
  }

  const body = await request.json().catch(() => ({}))
  const { siswaDetailId, mapelId, tipeTest, judul, tanggal, nilai, catatan } = body

  if (!siswaDetailId || !mapelId) throw svelteError(400, 'Siswa dan mapel wajib diisi')
  if (!['pre_test', 'try_out', 'post_test'].includes(tipeTest)) {
    throw svelteError(400, 'Tipe test tidak valid')
  }
  if (!judul?.trim()) throw svelteError(400, 'Judul wajib diisi')
  if (!tanggal) throw svelteError(400, 'Tanggal wajib diisi')
  if (!Number.isInteger(nilai) || nilai < 0 || nilai > 100) {
    throw svelteError(400, 'Nilai harus bilangan bulat 0-100')
  }

  // kepala_guru also teaches, so it goes through the same ownership check.
  if (!(await mengajar(profile.id, siswaDetailId, mapelId))) {
    throw svelteError(403, 'Anda tidak mengajar siswa ini')
  }

  const { data, error } = await supabaseAdmin
    .from('nilai_manual')
    .insert({
      siswa_detail_id: siswaDetailId,
      mapel_id: mapelId,
      materi_id: null,
      tipe_test: tipeTest,
      judul: judul.trim(),
      tanggal,
      nilai,
      catatan: catatan?.trim() || null,
      tentor_id: profile.id,
      tahun_ajaran_id: profile.tahun_ajaran_id
    })
    .select()
    .single()

  if (error) throw svelteError(400, error.message)

  return json(data)
}
