import { panggil } from '$lib/api/panggil'

export interface SiswaPresensi {
  siswa_detail_id: string
  nama_lengkap: string
}

export interface EntryPresensi {
  siswaDetailId: string
  isHadir: boolean
}

export async function listSiswaByKelas(kelasId: string): Promise<SiswaPresensi[]> {
  return panggil<SiswaPresensi[]>('/api/presensi/murid', 'listSiswaByKelas', kelasId)
}

export async function getPresensiBySesi(sesiId: string): Promise<Record<string, boolean>> {
  return panggil<Record<string, boolean>>('/api/presensi/murid', 'getPresensiBySesi', sesiId)
}

export async function savePresensi(sesiId: string, entries: EntryPresensi[]) {
  const res = await fetch('/api/presensi-murid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sesiId, entries })
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? 'Gagal menyimpan presensi')
  }

  return res.json() as Promise<{ saved: number }>
}
