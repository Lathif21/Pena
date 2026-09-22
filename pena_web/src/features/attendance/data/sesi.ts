import { panggil } from '$lib/api/panggil'

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

export async function listKelasByTentor(tentorId: string): Promise<Pilihan[]> {
  return panggil<Pilihan[]>('/api/sesi/pilihan', 'listKelasByTentor', tentorId)
}

export async function listMapelByKelas(kelasId: string, tentorId: string): Promise<Pilihan[]> {
  return panggil<Pilihan[]>('/api/sesi/pilihan', 'listMapelByKelas', kelasId, tentorId)
}

export async function getSesiAktif(tentorId: string): Promise<Sesi | null> {
  return panggil<Sesi | null>('/api/sesi/pilihan', 'getSesiAktif', tentorId)
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
