import { supabase } from '$lib/supabase/client'

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

/** Materi milik mapel sesi aktif — bukan seluruh materi di bimbel. */
export async function listMateriByMapel(mapelId: string): Promise<MateriPilihan[]> {
  const { data, error } = await supabase
    .from('materi')
    .select('id, nama, nomor_urut')
    .eq('mapel_id', mapelId)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (error) throw error
  return data ?? []
}

export async function getJurnalBySesi(sesiId: string): Promise<Jurnal | null> {
  const { data, error } = await supabase
    .from('jurnal_mengajar')
    .select('*')
    .eq('sesi_id', sesiId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return data
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
