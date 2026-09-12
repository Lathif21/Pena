import { supabase } from '$lib/supabase/client'

export interface Siswa {
  id: string
  siswa_detail_id: string
  nama_lengkap: string
  email: string
  nis: string
  paket: 'regular' | 'privat'
  /** Active enrolment, empty when the student is not in any kelas. */
  kelas_id?: string
  kelas_nama?: string
  created_at: string
  deleted_at: string | null
}

export async function listSiswa() {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      nama_lengkap,
      email,
      created_at,
      deleted_at,
      siswa_detail:siswa_detail(id, nis, paket)
    `)
    .eq('role', 'siswa')
    .is('deleted_at', null)
    .order('nama_lengkap')

  if (error) throw error

  return data.map((profile: any) => ({
    id: profile.id,
    siswa_detail_id: profile.siswa_detail?.[0]?.id || '',
    nama_lengkap: profile.nama_lengkap,
    email: profile.email,
    nis: profile.siswa_detail?.[0]?.nis || '',
    paket: profile.siswa_detail?.[0]?.paket || 'regular',
    created_at: profile.created_at,
    deleted_at: profile.deleted_at
  })) as Siswa[]
}

export async function createSiswa(
  nama_lengkap: string,
  email: string,
  password: string,
  nis: string,
  paket: 'regular' | 'privat',
  tahun_ajaran_id: string,
  kelas_id?: string,
  tentor_mapel?: Array<{ tentor_id: string; mapel_id: string }>
) {
  if (!tahun_ajaran_id) throw new Error('Tahun ajaran wajib dipilih')
  if (paket === 'regular' && !kelas_id) throw new Error('Kelas wajib dipilih untuk paket regular')
  if (paket === 'privat' && (!tentor_mapel || tentor_mapel.length === 0)) {
    throw new Error('Tentor dan mapel wajib dipilih untuk paket privat')
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  })

  if (authError) throw authError
  if (!authData.user?.id) throw new Error('Gagal membuat akun. Email mungkin sudah terpakai.')

  // Wait for auth user to be created
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      nama_lengkap,
      email,
      role: 'siswa',
      tahun_ajaran_id
    })

  if (profileError) throw profileError

  // Create siswa_detail
  const { data: siswaDetail, error: detailError } = await supabase
    .from('siswa_detail')
    .insert({
      profile_id: authData.user.id,
      nis,
      paket
    })
    .select()
    .single()

  if (detailError) throw detailError

  // If regular paket, assign to kelas
  if (paket === 'regular' && kelas_id) {
    const { error: kelasError } = await supabase
      .from('siswa_kelas')
      .insert({
        siswa_detail_id: siswaDetail.id,
        kelas_id,
        tahun_ajaran_id
      })

    if (kelasError) throw kelasError
  }

  // If privat paket, assign to tentor + mapel
  if (paket === 'privat' && tentor_mapel && tentor_mapel.length > 0) {
    const assignments = tentor_mapel.map((tm) => ({
      siswa_detail_id: siswaDetail.id,
      tentor_id: tm.tentor_id,
      mapel_id: tm.mapel_id,
      tahun_ajaran_id
    }))

    const { error: privatError } = await supabase
      .from('tentor_siswa_privat')
      .insert(assignments)

    if (privatError) throw privatError
  }

  return authData.user
}

export async function deleteSiswa(id: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
