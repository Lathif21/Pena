import { supabase } from '$lib/supabase/client'

export interface Sesi {
  id: string
  tentor_id: string
  kelas_id: string
  mapel_id: string
  foto_path: string
  uploaded_at: string
  started_at: string
  ended_at: string | null
  status: 'open' | 'closed'
}

export interface Pilihan {
  id: string
  nama: string
}

/** Kelas yang benar-benar diajar tentor ini — bukan seluruh kelas di bimbel. */
export async function listKelasByTentor(tentorId: string): Promise<Pilihan[]> {
  const { data, error } = await supabase
    .from('tentor_kelas_mapel')
    .select('kelas:kelas_id(id, nama, deleted_at)')
    .eq('tentor_id', tentorId)
    .is('deleted_at', null)

  if (error) throw error

  const unik = new Map<string, Pilihan>()
  for (const row of (data ?? []) as any[]) {
    const k = row.kelas
    if (k && !k.deleted_at) unik.set(k.id, { id: k.id, nama: k.nama })
  }

  return [...unik.values()].sort((a, b) => a.nama.localeCompare(b.nama))
}

/**
 * Irisan dua relasi: mapel yang dipakai kelas itu (`mapel_kelas`) DAN yang
 * diajar tentor ini di kelas itu (`tentor_kelas_mapel`). Memakai salah satunya
 * saja akan menawarkan mapel yang tidak berhak dia isi presensinya.
 */
export async function listMapelByKelas(kelasId: string, tentorId: string): Promise<Pilihan[]> {
  const [{ data: diajar, error: eDiajar }, { data: dipakai, error: eDipakai }] = await Promise.all([
    supabase
      .from('tentor_kelas_mapel')
      .select('mapel_id')
      .eq('tentor_id', tentorId)
      .eq('kelas_id', kelasId)
      .is('deleted_at', null),
    supabase.from('mapel_kelas').select('mapel_id').eq('kelas_id', kelasId)
  ])

  if (eDiajar) throw eDiajar
  if (eDipakai) throw eDipakai

  const dipakaiSet = new Set((dipakai ?? []).map((m) => m.mapel_id))
  const ids = [...new Set((diajar ?? []).map((m) => m.mapel_id))].filter((id) => dipakaiSet.has(id))
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('mapel')
    .select('id, nama')
    .in('id', ids)
    .is('deleted_at', null)
    .order('nama')

  if (error) throw error
  return data ?? []
}

/** Sesi yang masih berjalan milik tentor ini. Paling banyak satu pada satu waktu. */
export async function getSesiAktif(tentorId: string): Promise<Sesi | null> {
  const { data, error } = await supabase
    .from('sesi_mengajar')
    .select('*')
    .eq('tentor_id', tentorId)
    .eq('status', 'open')
    .is('deleted_at', null)
    .order('started_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return (data ?? [])[0] ?? null
}

/**
 * Membuka sesi. Foto diunggah lewat endpoint, bukan langsung dari browser ke
 * storage — endpoint yang memverifikasi tentor memang mengajar kelas+mapel ini.
 */
export async function openSesi(kelasId: string, mapelId: string, file: File): Promise<Sesi> {
  const form = new FormData()
  form.set('kelasId', kelasId)
  form.set('mapelId', mapelId)
  form.set('foto', file)

  const res = await fetch('/api/sesi', { method: 'POST', body: form })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? 'Gagal membuka sesi')
  }
  return res.json()
}

/** Mengganti foto presensi. Hanya boleh selagi sesi masih open. */
export async function replaceFoto(sesiId: string, file: File): Promise<Sesi> {
  const form = new FormData()
  form.set('foto', file)

  const res = await fetch(`/api/sesi/${sesiId}/foto`, { method: 'POST', body: form })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? 'Gagal mengganti foto')
  }
  return res.json()
}
