import { panggil } from '$lib/api/panggil'

export interface NilaiManual {
  id: string
  siswa_detail_id: string
  mapel_id: string
  materi_id: string | null
  tipe_test: 'pre_test' | 'try_out' | 'post_test'
  judul: string
  tanggal: string
  nilai: number
  catatan: string | null
}

export interface SiswaWithNilai {
  siswa_detail_id: string
  nama_lengkap: string
  nilai: number | null
}

/** Goes through /api/nilai-manual, which verifies the tentor teaches this student. */
export async function createNilaiManual(
  siswaDetailId: string,
  mapelId: string,
  tipeTest: 'pre_test' | 'try_out' | 'post_test',
  judul: string,
  tanggal: string,
  nilai: number,
  catatan: string | null
) {
  const res = await fetch('/api/nilai-manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siswaDetailId, mapelId, tipeTest, judul, tanggal, nilai, catatan })
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? 'Gagal menyimpan nilai')
  }

  return res.json()
}

export async function listNilaiManual(siswaDetailId: string, mapelId: string): Promise<NilaiManual[]> {
  return panggil<NilaiManual[]>('/api/nilai/manual', 'listNilaiManual', siswaDetailId, mapelId)
}
