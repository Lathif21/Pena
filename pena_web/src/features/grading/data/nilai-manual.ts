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

export async function createNilaiManual(
  siswaDetailId: string,
  mapelId: string,
  tipeTest: 'pre_test' | 'try_out' | 'post_test',
  judul: string,
  tanggal: string,
  nilai: number,
  catatan: string | null,
  tentorId: string,
  tahunAjaranId: string
) {
  // Validasi tentor mengajar siswa tersebut
  const { data: tkm } = await supabase
    .from('tentor_kelas_mapel')
    .select('kelas_id')
    .eq('tentor_id', tentorId)
    .eq('mapel_id', mapelId)
    .is('deleted_at', null)

  const { data: tsp } = await supabase
    .from('tentor_siswa_privat')
    .select('id')
    .eq('tentor_id', tentorId)
    .eq('mapel_id', mapelId)
    .eq('siswa_detail_id', siswaDetailId)
    .is('deleted_at', null)

  let canGrade = false

  // Check privat
  if (tsp && tsp.length > 0) {
    canGrade = true
  }

  // Check kelas
  if (!canGrade && tkm && tkm.length > 0) {
    const kelasIds = tkm.map(k => k.kelas_id)

    const { data: sk } = await supabase
      .from('siswa_kelas')
      .select('id')
      .eq('siswa_detail_id', siswaDetailId)
      .in('kelas_id', kelasIds)
      .is('deleted_at', null)

    if (sk && sk.length > 0) {
      canGrade = true
    }
  }

  if (!canGrade) {
    throw new Error('Tentor tidak mengajar siswa ini')
  }

  if (nilai < 0 || nilai > 100) {
    throw new Error('Nilai harus antara 0-100')
  }

  const { data, error } = await supabase
    .from('nilai_manual')
    .insert([{
      siswa_detail_id: siswaDetailId,
      mapel_id: mapelId,
      materi_id: null,
      tipe_test: tipeTest,
      judul,
      tanggal,
      nilai,
      catatan,
      tentor_id: tentorId,
      tahun_ajaran_id: tahunAjaranId
    }])
    .select()
    .single()

  if (error) throw error
  return data
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
