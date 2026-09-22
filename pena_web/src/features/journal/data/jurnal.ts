import { panggil } from '$lib/api/panggil'

export interface Jurnal {
  id: string
  sesi_id: string
  materi_id: string
  deskripsi: string
  status: 'draft' | 'submitted'
  submitted_at: string | null
}

export interface MateriPilihan {
  id: string
  nama: string
  nomor_urut: number
}

export async function listMateriByMapel(mapelId: string): Promise<MateriPilihan[]> {
  return panggil<MateriPilihan[]>('/api/jurnal/data', 'listMateriByMapel', mapelId)
}

export async function getJurnalBySesi(sesiId: string): Promise<Jurnal | null> {
  return panggil<Jurnal | null>('/api/jurnal/data', 'getJurnalBySesi', sesiId)
}

/**
 * Simpan jurnal sebagai draft. Memanggil ulang akan memperbarui isi yang sama,
 * bukan membuat baris kedua — `jurnal_mengajar.sesi_id` unique di database.
 */
export async function saveJurnal(sesiId: string, materiId: string, deskripsi: string) {
  const res = await fetch('/api/jurnal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sesiId, materiId, deskripsi })
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? 'Gagal menyimpan jurnal')
  }

  return res.json() as Promise<Jurnal>
}
