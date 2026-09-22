import { supabaseAdmin as supabase } from '$lib/supabase/admin.server'
import type { NilaiManual, SiswaWithNilai } from './nilai-manual'

export async function listNilaiManual(siswaDetailId: string, mapelId: string): Promise<NilaiManual[]> {
  const { data, error } = await supabase
    .from('nilai_manual')
    .select('*')
    .eq('siswa_detail_id', siswaDetailId)
    .eq('mapel_id', mapelId)
    .is('deleted_at', null)
    .order('tanggal', { ascending: false })

  if (error) throw error
  return data || []
}
