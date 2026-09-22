import { supabaseAdmin } from '$lib/supabase/admin.server'
import type { Soal } from './soal'

export interface PilihanInput {
  teks: string
  is_benar: boolean
}

/** Shared by create and update — the rules that make a soal gradeable at all. */
export function validatePilihan(pilihan: PilihanInput[]) {
  if (!Array.isArray(pilihan) || pilihan.length < 2) return 'Minimal 2 pilihan jawaban'
  if (pilihan.some((p) => !p?.teks?.trim())) return 'Semua pilihan harus diisi'
  if (pilihan.filter((p) => p.is_benar).length !== 1) return 'Harus tepat 1 jawaban benar'
  return null
}

/**
 * Whether a try out's soal may be added to, edited, or deleted.
 *
 * A published try out locks its own soal — a question changing under a student
 * mid-attempt would silently corrupt their score. KG unpublishes first, edits, then
 * republishes. Once the window has closed the lock is permanent, because the results
 * are real. Soal now hang off one try out, so this no longer affects its siblings.
 *
 * Latihan (sub materi) is never locked: retries are unlimited, nothing to corrupt.
 */
export async function tryOutSoalLock(tryOutId: string) {
  const { data: tryOut } = await supabaseAdmin
    .from('try_out')
    .select('status, waktu_buka, durasi_menit')
    .eq('id', tryOutId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!tryOut) return { locked: true, reason: 'Try out tidak ditemukan' }
  if (tryOut.status !== 'published') return { locked: false, reason: '' }

  const tutup = new Date(tryOut.waktu_buka).getTime() + tryOut.durasi_menit * 60000
  return Date.now() > tutup
    ? { locked: true, reason: 'Try out sudah selesai — soal tidak bisa diubah lagi' }
    : { locked: true, reason: 'Batalkan publish try out dulu sebelum mengubah soal' }
}

/** Resolves a soal's parent, then applies the lock rule above. */
export async function soalLock(soalId: string) {
  const { data: soal } = await supabaseAdmin
    .from('soal')
    .select('try_out_id')
    .eq('id', soalId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!soal) return null
  if (!soal.try_out_id) return { locked: false, reason: '' }

  return tryOutSoalLock(soal.try_out_id)
}

export async function nextNomorUrut(parentColumn: 'try_out_id' | 'sub_materi_id', parentId: string) {
  const { data } = await supabaseAdmin
    .from('soal')
    .select('nomor_urut')
    .eq(parentColumn, parentId)
    .is('deleted_at', null)
    .order('nomor_urut', { ascending: false })
    .limit(1)

  return ((data ?? [])[0]?.nomor_urut ?? 0) + 1
}

/**
 * Swaps a soal's answer choices for a new set.
 *
 * Soft delete, not hard: `jawaban_siswa.pilihan_jawaban_id` has a foreign key onto
 * `pilihan_jawaban`, so once any student has answered, a hard delete is rejected.
 * The previous version ignored that failure and inserted anyway, leaving the old
 * choices in place alongside the new ones — the source of duplicated options.
 * Soft-deleting also keeps the choice a student actually picked readable.
 */
export async function replacePilihan(soalId: string, pilihan: PilihanInput[]) {
  const { error: clearError } = await supabaseAdmin
    .from('pilihan_jawaban')
    .update({ deleted_at: new Date().toISOString() })
    .eq('soal_id', soalId)
    .is('deleted_at', null)

  if (clearError) throw new Error(clearError.message)

  const { error } = await supabaseAdmin.from('pilihan_jawaban').insert(
    pilihan.map((p, i) => ({
      soal_id: soalId,
      teks: p.teks.trim(),
      is_benar: p.is_benar,
      nomor_urut: i + 1
    }))
  )

  if (error) throw new Error(error.message)
}

export async function listSoalBySubMateri(subMateriId: string): Promise<Soal[]> {
  const { data, error } = await supabaseAdmin
    .from('soal')
    .select('id, pertanyaan, nomor_urut')
    .eq('sub_materi_id', subMateriId)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (error) throw error
  if (!data) return []

  const soalIds = data.map(s => s.id)
  if (soalIds.length === 0) return []

  const { data: pilihan, error: pilihanError } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
    .from('soal')
    .select('id, pertanyaan, nomor_urut')
    .eq('try_out_id', tryOutId)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (error) throw error
  if (!data) return []

  const soalIds = data.map(s => s.id)
  if (soalIds.length === 0) return []

  const { data: pilihan, error: pilihanError } = await supabaseAdmin
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
