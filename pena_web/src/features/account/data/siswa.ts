import { panggil } from '$lib/api/panggil'

export interface Siswa {
  id: string
  siswa_detail_id: string
  nama_lengkap: string
  email: string
  nis: string
  paket: 'regular' | 'privat'
  /** Active enrolment, empty when the student is not in any kelas. */
  kelas_id?: string
  kelas_nama?: string
  created_at: string
  deleted_at: string | null
}

export async function listSiswa(): Promise<Siswa[]> {
  return panggil<Siswa[]>('/api/akun/siswa', 'listSiswa')
}

export async function createSiswa(
  nama_lengkap: string,
  email: string,
  password: string,
  nis: string,
  paket: 'regular' | 'privat',
  tahun_ajaran_id: string,
  kelas_id?: string,
  tentor_mapel?: Array<{ tentor_id: string; mapel_id: string }>
): Promise<string> {
  return panggil<string>('/api/akun/siswa', 'createSiswa', nama_lengkap, email, password, nis, paket, tahun_ajaran_id, kelas_id, tentor_mapel)
}

export async function deleteSiswa(id: string): Promise<void> {
  return panggil<void>('/api/akun/siswa', 'deleteSiswa', id)
}
