import { panggil } from '$lib/api/panggil'

export interface Mapel {
  id: string
  nama: string
  created_at: string
  deleted_at: string | null
  /** Diisi oleh listMapel() — kelas yang memakai mapel ini */
  kelas_ids?: string[]
}

export async function listMapel(): Promise<Mapel[]> {
  return panggil<Mapel[]>('/api/master/mapel', 'listMapel')
}

export async function createMapel(nama: string, kelasIds: string[] = []): Promise<Mapel> {
  return panggil<Mapel>('/api/master/mapel', 'createMapel', nama, kelasIds)
}

export async function updateMapel(id: string, nama: string, kelasIds: string[] = []): Promise<Mapel> {
  return panggil<Mapel>('/api/master/mapel', 'updateMapel', id, nama, kelasIds)
}

export async function deleteMapel(id: string): Promise<void> {
  return panggil<void>('/api/master/mapel', 'deleteMapel', id)
}

export async function listKelasForMapel(mapelId: string): Promise<string[]> {
  return panggil<string[]>('/api/master/mapel', 'listKelasForMapel', mapelId)
}

export async function setMapelKelas(mapelId: string, kelasIds: string[]): Promise<void> {
  return panggil<void>('/api/master/mapel', 'setMapelKelas', mapelId, kelasIds)
}

export async function listMapelForKelas(kelasId: string): Promise<Mapel[]> {
  return panggil<Mapel[]>('/api/master/mapel', 'listMapelForKelas', kelasId)
}
