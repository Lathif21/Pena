import { supabase } from '$lib/supabase/client'

export interface TryOut {
  id: string
  materi_id: string
  judul: string
  tipe_test: 'biasa' | 'pre_test' | 'post_test'
  waktu_buka: string
  durasi_menit: number
  status: 'draft' | 'published'
  published_at: string | null
}

/** Mutations go through /api/try-out — kepala guru is verified server-side. */
async function call<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) }
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? 'Gagal memproses try out')
  }

  return res.json() as Promise<T>
}

export function createTryOut(
  materiId: string,
  judul: string,
  tipeTest: 'biasa' | 'pre_test' | 'post_test',
  waktuBuka: string,
  durasiMenit: number,
  kelasIds: string[]
) {
  return call<TryOut>('/api/try-out', {
    method: 'POST',
    body: JSON.stringify({ materiId, judul, tipeTest, waktuBuka, durasiMenit, kelasIds })
  })
}

export function updateTryOut(
  tryOutId: string,
  judul: string,
  tipeTest: 'biasa' | 'pre_test' | 'post_test',
  waktuBuka: string,
  durasiMenit: number,
  kelasIds: string[]
) {
  return call<{ updated: true }>(`/api/try-out/${tryOutId}`, {
    method: 'PATCH',
    body: JSON.stringify({ judul, tipeTest, waktuBuka, durasiMenit, kelasIds })
  })
}

export function publishTryOut(tryOutId: string) {
  return call<{ published: true }>(`/api/try-out/${tryOutId}/publish`, { method: 'POST' })
}

/** Back to draft so the soal can be revised. Refused once the window has closed. */
export function unpublishTryOut(tryOutId: string) {
  return call<{ unpublished: true }>(`/api/try-out/${tryOutId}/unpublish`, { method: 'POST' })
}

/** Soft delete, together with the try out's soal. Draft and un-attempted only. */
export function deleteTryOut(tryOutId: string) {
  return call<{ deleted: true }>(`/api/try-out/${tryOutId}/delete`, { method: 'POST' })
}

export async function getTryOut(tryOutId: string): Promise<TryOut | null> {
  const { data, error } = await supabase
    .from('try_out')
    .select('*')
    .eq('id', tryOutId)
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return data
}

export async function getTryOutKelas(tryOutId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('try_out_kelas')
    .select('kelas_id')
    .eq('try_out_id', tryOutId)

  if (error) throw error
  return data?.map(d => d.kelas_id) || []
}
