import { panggil } from '$lib/api/panggil'

export interface Kelas {
  id: string
  nama: string
  created_at: string
  deleted_at: string | null
}

export async function listKelas(): Promise<Kelas[]> {
  return panggil<Kelas[]>('/api/master/kelas', 'listKelas')
}

export async function createKelas(nama: string): Promise<Kelas> {
  return panggil<Kelas>('/api/master/kelas', 'createKelas', nama)
}

export async function updateKelas(id: string, nama: string): Promise<Kelas> {
  return panggil<Kelas>('/api/master/kelas', 'updateKelas', id, nama)
}

export async function deleteKelas(id: string): Promise<void> {
  return panggil<void>('/api/master/kelas', 'deleteKelas', id)
}
