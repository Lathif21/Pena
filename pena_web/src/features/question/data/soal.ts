import { supabase } from '$lib/supabase/client'

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
  const { data, error } = await supabase
    .from('soal')
    .select('id, pertanyaan, nomor_urut')
    .eq('sub_materi_id', subMateriId)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (error) throw error
  if (!data) return []

  const soalIds = data.map(s => s.id)
  if (soalIds.length === 0) return []

  const { data: pilihan, error: pilihanError } = await supabase
    .from('pilihan_jawaban')
    .select('id, soal_id, teks, is_benar, nomor_urut')
    .in('soal_id', soalIds)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (pilihanError) throw pilihanError

  const pilihanByQuestionId = new Map<string, PilihanJawaban[]>()
  pilihan?.forEach(p => {
    if (!pilihanByQuestionId.has(p.soal_id)) {
      pilihanByQuestionId.set(p.soal_id, [])
    }
    pilihanByQuestionId.get(p.soal_id)?.push({
      id: p.id,
      teks: p.teks,
      is_benar: p.is_benar,
      nomor_urut: p.nomor_urut
    })
  })

  return data.map(s => ({
    id: s.id,
    pertanyaan: s.pertanyaan,
    nomor_urut: s.nomor_urut,
    pilihan: pilihanByQuestionId.get(s.id) || []
  }))
}

export async function listSoalByTryOut(tryOutId: string): Promise<Soal[]> {
  const { data, error } = await supabase
    .from('soal')
    .select('id, pertanyaan, nomor_urut')
    .eq('try_out_id', tryOutId)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (error) throw error
  if (!data) return []

  const soalIds = data.map(s => s.id)
  if (soalIds.length === 0) return []

  const { data: pilihan, error: pilihanError } = await supabase
    .from('pilihan_jawaban')
    .select('id, soal_id, teks, is_benar, nomor_urut')
    .in('soal_id', soalIds)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (pilihanError) throw pilihanError

  const pilihanByQuestionId = new Map<string, PilihanJawaban[]>()
  pilihan?.forEach(p => {
    if (!pilihanByQuestionId.has(p.soal_id)) {
      pilihanByQuestionId.set(p.soal_id, [])
    }
    pilihanByQuestionId.get(p.soal_id)?.push({
      id: p.id,
      teks: p.teks,
      is_benar: p.is_benar,
      nomor_urut: p.nomor_urut
    })
  })

  return data.map(s => ({
    id: s.id,
    pertanyaan: s.pertanyaan,
    nomor_urut: s.nomor_urut,
    pilihan: pilihanByQuestionId.get(s.id) || []
  }))
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
