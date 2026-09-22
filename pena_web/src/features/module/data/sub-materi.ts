import { panggil } from '$lib/api/panggil'

export interface SubMateri {
  id: string
  materi_id: string
  nama: string
  nomor_urut: number
  created_at: string
  deleted_at: string | null
}

export async function listSubMateri(materiId: string): Promise<SubMateri[]> {
  return panggil<SubMateri[]>('/api/konten/sub-materi', 'listSubMateri', materiId)
}

export async function createSubMateri(materiId: string, nama: string, nomorUrut: number): Promise<SubMateri> {
  return panggil<SubMateri>('/api/konten/sub-materi', 'createSubMateri', materiId, nama, nomorUrut)
}

export async function updateSubMateri(id: string, nama: string, nomorUrut: number): Promise<SubMateri> {
  return panggil<SubMateri>('/api/konten/sub-materi', 'updateSubMateri', id, nama, nomorUrut)
}

export async function softDeleteSubMateri(id: string): Promise<void> {
  return panggil<void>('/api/konten/sub-materi', 'softDeleteSubMateri', id)
}
