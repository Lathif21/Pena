import { supabaseAdmin as supabase } from '$lib/supabase/admin.server'
import type { SiswaPresensi, EntryPresensi } from './presensi-murid'

/**
 * Siswa di kelas sesi ini, lewat `siswa_kelas`.
 *
 * Siswa privat otomatis tidak muncul karena mereka memang tidak punya kelas —
 * itu bukan filter tambahan, melainkan akibat langsung dari sumber datanya.
 */
export async function listSiswaByKelas(kelasId: string): Promise<SiswaPresensi[]> {
  const { data, error } = await supabase
    .from('siswa_kelas')
    .select('siswa_detail:siswa_detail_id(id, deleted_at, profiles:profile_id(nama_lengkap))')
    .eq('kelas_id', kelasId)
    .is('deleted_at', null)

  if (error) throw error

  return ((data ?? []) as any[])
    .map((row) => row.siswa_detail)
    .filter((s) => s && !s.deleted_at)
    .map((s) => ({
      siswa_detail_id: s.id,
        nama_lengkap: s.profiles?.nama_lengkap ?? '(tanpa nama)'
    }))
    .sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap))
}

/** Presensi yang sudah tersimpan untuk sesi ini, supaya centang tidak mundur saat dibuka lagi. */
export async function getPresensiBySesi(sesiId: string): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from('presensi_murid')
    .select('siswa_detail_id, is_hadir')
    .eq('sesi_id', sesiId)

  if (error) throw error
  return Object.fromEntries((data ?? []).map((p: any) => [p.siswa_detail_id, p.is_hadir]))
}
