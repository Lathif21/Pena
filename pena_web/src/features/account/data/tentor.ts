import { panggil } from '$lib/api/panggil'

export interface Tentor {
  id: string
  nama_lengkap: string
  email: string
  created_at: string
  deleted_at: string | null
}

export async function listTentor(): Promise<Tentor[]> {
  return panggil<Tentor[]>('/api/akun/tentor', 'listTentor')
}

export async function createTentor(
  nama_lengkap: string,
  email: string,
  password: string,
  tahun_ajaran_id: string
): Promise<string> {
  return panggil<string>('/api/akun/tentor', 'createTentor', nama_lengkap, email, password, tahun_ajaran_id)
}

export async function deleteTentor(id: string): Promise<void> {
  return panggil<void>('/api/akun/tentor', 'deleteTentor', id)
}
