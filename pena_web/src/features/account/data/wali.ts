import { panggil } from '$lib/api/panggil'

export interface Wali {
  id: string
  nama_lengkap: string
  email: string
  created_at: string
  deleted_at: string | null
}

export async function listWali(): Promise<Wali[]> {
  return panggil<Wali[]>('/api/akun/wali', 'listWali')
}

export async function createWali(
  nama_lengkap: string,
  email: string,
  password: string,
  tahun_ajaran_id: string,
  siswa_ids: string[]
): Promise<string> {
  return panggil<string>('/api/akun/wali', 'createWali', nama_lengkap, email, password, tahun_ajaran_id, siswa_ids)
}

export async function deleteWali(id: string): Promise<void> {
  return panggil<void>('/api/akun/wali', 'deleteWali', id)
}

export async function listSiswaIdsForWali(waliId: string): Promise<string[]> {
  return panggil<string[]>('/api/akun/wali', 'listSiswaIdsForWali', waliId)
}
