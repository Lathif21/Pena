export interface Relief {
  id: string
  tentor_asli_id: string
  pengganti_id: string
  kelas_id: string
  mapel_id: string
  tanggal: string
  task: string
  status: 'aktif' | 'dibatalkan'
  email_error: string | null
  tentorAsliNama?: string
  penggantiNama?: string
  kelasNama?: string
  mapelNama?: string
}

export interface Pilihan {
  id: string
  nama: string
}

/** Kombinasi kelas+mapel yang diajar tentor ini — sumber dua dropdown di form. */
export interface KelasMapel {
  kelasId: string
  kelasNama: string
  mapelId: string
  mapelNama: string
}

/**
 * Mengajukan relief. Lewat endpoint, bukan insert langsung — endpoint yang
 * memverifikasi tentor asli memang mengajar kelas+mapel itu dan yang mengirim
 * email ke pengganti serta kepala guru.
 *
 * Balasannya memuat `emailError` kalau SMTP gagal: reliefnya tetap tersimpan
 * dan tetap sah, tapi penggantinya perlu dikabari manual.
 */
export async function createRelief(input: {
  penggantiId: string
  kelasId: string
  mapelId: string
  tanggal: string
  task: string
}): Promise<{ relief: Relief; emailError: string | null }> {
  const res = await fetch('/api/relief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? 'Gagal mengajukan relief')
  }
  return res.json()
}

export async function cancelRelief(id: string): Promise<{ emailError: string | null }> {
  const res = await fetch(`/api/relief/${id}/cancel`, { method: 'POST' })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? 'Gagal membatalkan relief')
  }
  return res.json()
}
