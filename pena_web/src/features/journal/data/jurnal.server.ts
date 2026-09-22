import { supabaseAdmin as supabase } from '$lib/supabase/admin.server'
import type { Jurnal, MateriPilihan } from './jurnal'

/** Materi milik mapel sesi aktif — bukan seluruh materi di bimbel. */
export async function listMateriByMapel(mapelId: string): Promise<MateriPilihan[]> {
  const { data, error } = await supabase
    .from('materi')
    .select('id, nama, nomor_urut')
    .eq('mapel_id', mapelId)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (error) throw error
  return data ?? []
}

export async function getJurnalBySesi(sesiId: string): Promise<Jurnal | null> {
  const { data, error } = await supabase
    .from('jurnal_mengajar')
    .select('*')
    .eq('sesi_id', sesiId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return data
}
