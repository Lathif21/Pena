import { panggil } from '$lib/api/panggil'

export interface TentorAssignment {
  id: string
  tentor_id: string
  tentor_nama: string
  kelas_id: string
  kelas_nama: string
  mapel_id: string
  mapel_nama: string
  tahun_ajaran_id: string
  created_at: string
  deleted_at: string | null
}

export async function listTentorAssignments(tahun_ajaran_id: string): Promise<TentorAssignment[]> {
  return panggil<TentorAssignment[]>('/api/assignment/tentor', 'listTentorAssignments', tahun_ajaran_id)
}

export async function createTentorAssignment(
  tentor_id: string,
  kelas_id: string,
  mapel_id: string,
  tahun_ajaran_id: string
): Promise<TentorAssignment> {
  return panggil<TentorAssignment>('/api/assignment/tentor', 'createTentorAssignment', tentor_id, kelas_id, mapel_id, tahun_ajaran_id)
}

export async function deleteTentorAssignment(id: string): Promise<void> {
  return panggil<void>('/api/assignment/tentor', 'deleteTentorAssignment', id)
}
