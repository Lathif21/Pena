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

export async function listSoalByMateri(materiId: string): Promise<Soal[]> {
  const { data, error } = await supabase
    .from('soal')
    .select('id, pertanyaan, nomor_urut')
    .eq('materi_id', materiId)
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

export async function createSoal(
  parentId: string,
  parentType: 'sub_materi' | 'materi',
  pertanyaan: string,
  pilihan: { teks: string; is_benar: boolean }[]
) {
  if (pilihan.length < 2) {
    throw new Error('Minimal 2 pilihan jawaban')
  }

  const benarCount = pilihan.filter(p => p.is_benar).length
  if (benarCount !== 1) {
    throw new Error('Harus tepat 1 jawaban benar')
  }

  // Get max nomor_urut
  const query = parentType === 'sub_materi'
    ? supabase.from('soal').select('nomor_urut').eq('sub_materi_id', parentId)
    : supabase.from('soal').select('nomor_urut').eq('materi_id', parentId)

  const { data: existing } = await query.is('deleted_at', null).order('nomor_urut', { ascending: false }).limit(1)
  const nextNomor = (existing?.[0]?.nomor_urut ?? 0) + 1

  const soalData = parentType === 'sub_materi'
    ? { sub_materi_id: parentId, pertanyaan, nomor_urut: nextNomor }
    : { materi_id: parentId, pertanyaan, nomor_urut: nextNomor }

  const { data: soal, error: soalError } = await supabase
    .from('soal')
    .insert([soalData])
    .select()
    .single()

  if (soalError) throw soalError

  const pilihanData = pilihan.map((p, idx) => ({
    soal_id: soal.id,
    teks: p.teks,
    is_benar: p.is_benar,
    nomor_urut: idx + 1
  }))

  const { error: pilihanError } = await supabase
    .from('pilihan_jawaban')
    .insert(pilihanData)

  if (pilihanError) throw pilihanError

  return soal
}

export async function updateSoal(
  soalId: string,
  pertanyaan: string,
  pilihan: { teks: string; is_benar: boolean }[]
) {
  if (pilihan.length < 2) {
    throw new Error('Minimal 2 pilihan jawaban')
  }

  const benarCount = pilihan.filter(p => p.is_benar).length
  if (benarCount !== 1) {
    throw new Error('Harus tepat 1 jawaban benar')
  }

  const { error: updateError } = await supabase
    .from('soal')
    .update({ pertanyaan })
    .eq('id', soalId)

  if (updateError) throw updateError

  await supabase
    .from('pilihan_jawaban')
    .update({ deleted_at: new Date().toISOString() })
    .eq('soal_id', soalId)
    .is('deleted_at', null)

  const pilihanData = pilihan.map((p, idx) => ({
    soal_id: soalId,
    teks: p.teks,
    is_benar: p.is_benar,
    nomor_urut: idx + 1
  }))

  const { error: insertError } = await supabase
    .from('pilihan_jawaban')
    .insert(pilihanData)

  if (insertError) throw insertError
}

export async function softDeleteSoal(soalId: string) {
  const now = new Date().toISOString()

  await supabase
    .from('pilihan_jawaban')
    .update({ deleted_at: now })
    .eq('soal_id', soalId)

  await supabase
    .from('soal')
    .update({ deleted_at: now })
    .eq('id', soalId)
}
