import { panggil } from '$lib/api/panggil'

export interface Materi {
  id: string
  mapel_id: string
  nama: string
  nomor_urut: number
  created_at: string
  deleted_at: string | null
}

export async function listMateri(mapelId: string): Promise<Materi[]> {
  return panggil<Materi[]>('/api/konten/materi', 'listMateri', mapelId)
}

export async function createMateri(mapelId: string, nama: string, nomorUrut: number): Promise<Materi> {
  return panggil<Materi>('/api/konten/materi', 'createMateri', mapelId, nama, nomorUrut)
}

export async function updateMateri(id: string, nama: string, nomorUrut: number): Promise<Materi> {
  return panggil<Materi>('/api/konten/materi', 'updateMateri', id, nama, nomorUrut)
}

export async function softDeleteMateri(id: string): Promise<void> {
  return panggil<void>('/api/konten/materi', 'softDeleteMateri', id)
}
