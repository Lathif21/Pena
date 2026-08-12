import { supabase } from '$lib/supabase/client'

export interface NilaiManual {
  id: string
  siswa_detail_id: string
  mapel_id: string
  materi_id: string | null
  tipe_test: 'pre_test' | 'try_out' | 'post_test'
  judul: string
  tanggal: string
  nilai: number
  catatan: string | null
}

export interface SiswaWithNilai {
  siswa_detail_id: string
  nama_lengkap: string
  nilai: number | null
}

export async function listSiswaByTentor(tentor_id: string, mapel_id: string, tahun_ajaran_id: string): Promise<SiswaWithNilai[]> {
  // Dari tentor_kelas_mapel
  const { data: tkm } = await supabase
    .from('tentor_kelas_mapel')
    .select('kelas_id')
    .eq('tentor_id', tentor_id)
    .eq('mapel_id', mapel_id)
    .is('deleted_at', null)

  let siswaList: SiswaWithNilai[] = []

  if (tkm && tkm.length > 0) {
    const kelasIds = tkm.map(k => k.kelas_id)

    const { data: sk } = await supabase
      .from('siswa_kelas')
      .select('siswa_detail_id')
      .in('kelas_id', kelasIds)
      .is('deleted_at', null)

    if (sk) {
      const siswaDetailIds = sk.map(s => s.siswa_detail_id)

      // nama_lengkap ada di profiles, bukan di siswa_detail
      const { data: siswaDetail } = await supabase
        .from('siswa_detail')
        .select('id, profiles:profile_id(nama_lengkap)')
        .in('id', siswaDetailIds)
        .is('deleted_at', null)

      if (siswaDetail) {
        siswaList = siswaDetail.map((s: any) => ({
          siswa_detail_id: s.id,
          nama_lengkap: s.profiles?.nama_lengkap ?? '(tanpa nama)',
          nilai: null
        }))
      }
    }
  }

  // Dari tentor_siswa_privat
  const { data: tsp } = await supabase
    .from('tentor_siswa_privat')
    .select('siswa_detail_id')
    .eq('tentor_id', tentor_id)
    .eq('mapel_id', mapel_id)
    .is('deleted_at', null)

  if (tsp) {
    const { data: siswaDetail } = await supabase
      .from('siswa_detail')
      .select('id, profiles:profile_id(nama_lengkap)')
      .in('id', tsp.map(t => t.siswa_detail_id))
      .is('deleted_at', null)

    if (siswaDetail) {
      siswaDetail.forEach((s: any) => {
        if (!siswaList.find(sl => sl.siswa_detail_id === s.id)) {
          siswaList.push({
            siswa_detail_id: s.id,
            nama_lengkap: s.profiles?.nama_lengkap ?? '(tanpa nama)',
            nilai: null
          })
        }
      })
    }
  }

  return siswaList
}

/** Goes through /api/nilai-manual, which verifies the tentor teaches this student. */
export async function createNilaiManual(
  siswaDetailId: string,
  mapelId: string,
  tipeTest: 'pre_test' | 'try_out' | 'post_test',
  judul: string,
  tanggal: string,
  nilai: number,
  catatan: string | null
) {
  const res = await fetch('/api/nilai-manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siswaDetailId, mapelId, tipeTest, judul, tanggal, nilai, catatan })
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? 'Gagal menyimpan nilai')
  }

  return res.json()
}

export async function listNilaiManual(siswaDetailId: string, mapelId: string): Promise<NilaiManual[]> {
  const { data, error } = await supabase
    .from('nilai_manual')
    .select('*')
    .eq('siswa_detail_id', siswaDetailId)
    .eq('mapel_id', mapelId)
    .is('deleted_at', null)
    .order('tanggal', { ascending: false })

  if (error) throw error
  return data || []
}
