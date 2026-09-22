import { panggil } from '$lib/api/panggil'

export interface PilihanJawaban {
  id: string
  teks: string
  is_benar: boolean
  nomor_urut: number
}

export interface Soal {
  id: string
  pertanyaan: string
  nomor_urut: number
  pilihan: PilihanJawaban[]
}

export async function listSoalBySubMateri(subMateriId: string): Promise<Soal[]> {
  return panggil<Soal[]>('/api/konten/soal', 'listSoalBySubMateri', subMateriId)
}

export async function listSoalByTryOut(tryOutId: string): Promise<Soal[]> {
  return panggil<Soal[]>('/api/konten/soal', 'listSoalByTryOut', tryOutId)
}

/** Mutations go through /api/soal — kepala guru is verified server-side. */
async function call<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) }
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? 'Gagal memproses soal')
  }

  return res.json() as Promise<T>
}

export function createSoal(
  parentId: string,
  parentType: 'sub_materi' | 'try_out',
  pertanyaan: string,
  pilihan: { teks: string; is_benar: boolean }[]
) {
  return call<Soal>('/api/soal', {
    method: 'POST',
    body: JSON.stringify({ parentId, parentType, pertanyaan, pilihan })
  })
}

export function updateSoal(
  soalId: string,
  pertanyaan: string,
  pilihan: { teks: string; is_benar: boolean }[]
) {
  return call<{ updated: true }>(`/api/soal/${soalId}`, {
    method: 'PATCH',
    body: JSON.stringify({ pertanyaan, pilihan })
  })
}

export function softDeleteSoal(soalId: string) {
  return call<{ deleted: true }>(`/api/soal/${soalId}`, { method: 'DELETE' })
}
