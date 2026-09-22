import { supabaseAdmin as supabase } from '$lib/supabase/admin.server'
import type { TentorAssignment } from './tentor-assignment'

export async function listTentorAssignments(tahun_ajaran_id: string) {
  const { data, error } = await supabase
    .from('tentor_kelas_mapel')
    .select(`
      id,
      tentor_id,
      kelas_id,
      mapel_id,
      tahun_ajaran_id,
      created_at,
      deleted_at,
      tentor:profiles!tentor_id(nama_lengkap),
      kelas(nama),
      mapel(nama)
    `)
    .eq('tahun_ajaran_id', tahun_ajaran_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data.map((item: any) => ({
    id: item.id,
    tentor_id: item.tentor_id,
    tentor_nama: item.tentor?.nama_lengkap || '',
    kelas_id: item.kelas_id,
    kelas_nama: item.kelas?.nama || '',
    mapel_id: item.mapel_id,
    mapel_nama: item.mapel?.nama || '',
    tahun_ajaran_id: item.tahun_ajaran_id,
    created_at: item.created_at,
    deleted_at: item.deleted_at
  })) as TentorAssignment[]
}

export async function createTentorAssignment(
  tentor_id: string,
  kelas_id: string,
  mapel_id: string,
  tahun_ajaran_id: string
) {
  const { data, error } = await supabase
    .from('tentor_kelas_mapel')
    .insert({
      tentor_id,
      kelas_id,
      mapel_id,
      tahun_ajaran_id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTentorAssignment(id: string) {
  const { error } = await supabase
    .from('tentor_kelas_mapel')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
