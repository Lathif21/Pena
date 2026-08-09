import { supabase } from '$lib/supabase/client'

export interface Mapel {
  id: string
  nama: string
  created_at: string
  deleted_at: string | null
  /** Diisi oleh listMapel() — kelas yang memakai mapel ini */
  kelas_ids?: string[]
}

export async function listMapel() {
  const { data, error } = await supabase
    .from('mapel')
    .select('id, nama, created_at, deleted_at, mapel_kelas(kelas_id)')
    .is('deleted_at', null)
    .order('nama')

  if (error) throw error

  return (data ?? []).map((m: any) => ({
    id: m.id,
    nama: m.nama,
    created_at: m.created_at,
    deleted_at: m.deleted_at,
    kelas_ids: (m.mapel_kelas ?? []).map((mk: any) => mk.kelas_id)
  })) as Mapel[]
}

export async function createMapel(nama: string, kelasIds: string[] = []) {
  const { data, error } = await supabase
    .from('mapel')
    .insert([{ nama }])
    .select()
    .single()

  if (error) throw error

  await setMapelKelas(data.id, kelasIds)

  return data as Mapel
}

export async function updateMapel(id: string, nama: string, kelasIds: string[] = []) {
  const { data, error } = await supabase
    .from('mapel')
    .update({ nama })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await setMapelKelas(id, kelasIds)

  return data as Mapel
}

export async function deleteMapel(id: string) {
  const { error } = await supabase
    .from('mapel')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

/** Kelas mana saja yang memakai mapel ini */
export async function listKelasForMapel(mapelId: string) {
  const { data, error } = await supabase
    .from('mapel_kelas')
    .select('kelas_id')
    .eq('mapel_id', mapelId)

  if (error) throw error
  return (data ?? []).map(r => r.kelas_id)
}

/**
 * Ganti seluruh relasi mapel -> kelas dengan daftar baru.
 * mapel_kelas murni tabel relasi (bukan data transaksional), jadi baris yang
 * tidak lagi dipilih memang dihapus, bukan di-soft-delete.
 */
export async function setMapelKelas(mapelId: string, kelasIds: string[]) {
  const { error: delError } = await supabase
    .from('mapel_kelas')
    .delete()
    .eq('mapel_id', mapelId)

  if (delError) throw delError

  if (kelasIds.length === 0) return

  const { error } = await supabase
    .from('mapel_kelas')
    .insert(kelasIds.map(kelas_id => ({ mapel_id: mapelId, kelas_id })))

  if (error) throw error
}

/** Mapel yang diajarkan di satu kelas */
export async function listMapelForKelas(kelasId: string) {
  const { data, error } = await supabase
    .from('mapel_kelas')
    .select('mapel:mapel_id(id, nama, deleted_at)')
    .eq('kelas_id', kelasId)

  if (error) throw error

  return (data ?? [])
    .map((r: any) => r.mapel)
    .filter((m: any) => m && !m.deleted_at) as Mapel[]
}
