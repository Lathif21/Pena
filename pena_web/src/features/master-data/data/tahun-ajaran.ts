import { panggil } from '$lib/api/panggil'

export interface TahunAjaran {
  id: string
  nama: string
  is_active: boolean
  created_at: string
  deleted_at: string | null
}

export async function listTahunAjaran(): Promise<TahunAjaran[]> {
  return panggil<TahunAjaran[]>('/api/master/tahun-ajaran', 'listTahunAjaran')
}

export async function createTahunAjaran(nama: string): Promise<TahunAjaran> {
  return panggil<TahunAjaran>('/api/master/tahun-ajaran', 'createTahunAjaran', nama)
}

export async function setActiveTahunAjaran(id: string): Promise<TahunAjaran> {
  return panggil<TahunAjaran>('/api/master/tahun-ajaran', 'setActiveTahunAjaran', id)
}

export async function deleteTahunAjaran(id: string): Promise<void> {
  return panggil<void>('/api/master/tahun-ajaran', 'deleteTahunAjaran', id)
}
