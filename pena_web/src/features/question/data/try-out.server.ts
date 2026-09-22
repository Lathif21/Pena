import { supabaseAdmin as supabase } from '$lib/supabase/admin.server'
import type { TryOut } from './try-out'

export async function getTryOut(tryOutId: string): Promise<TryOut | null> {
  const { data, error } = await supabase
    .from('try_out')
    .select('*')
    .eq('id', tryOutId)
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return data
}

export async function getTryOutKelas(tryOutId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('try_out_kelas')
    .select('kelas_id')
    .eq('try_out_id', tryOutId)

  if (error) throw error
  return data?.map(d => d.kelas_id) || []
}
