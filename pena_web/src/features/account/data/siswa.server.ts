import { supabaseAdmin as supabase } from '$lib/supabase/admin.server'
import { createAccount, rollbackAccount } from './account.server'
import type { Siswa } from './siswa'

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

  const profileId = await createAccount({
    role: 'siswa',
    nama_lengkap,
    email,
    password,
    tahun_ajaran_id
  })

  // Mulai dari sini setiap kegagalan menarik akunnya kembali: siswa tanpa
  // siswa_detail tidak bisa dipakai di mana pun, dan NIS-nya ikut terkunci.
  try {
    const { data: siswaDetail, error: detailError } = await supabase
      .from('siswa_detail')
      .insert({ profile_id: profileId, nis, paket })
      .select()
      .single()

    if (detailError) throw detailError

    if (paket === 'regular' && kelas_id) {
      const { error: kelasError } = await supabase
        .from('siswa_kelas')
        .insert({ siswa_detail_id: siswaDetail.id, kelas_id, tahun_ajaran_id })

      if (kelasError) throw kelasError
    }

    if (paket === 'privat' && tentor_mapel && tentor_mapel.length > 0) {
      const { error: privatError } = await supabase.from('tentor_siswa_privat').insert(
        tentor_mapel.map((tm) => ({
          siswa_detail_id: siswaDetail.id,
          tentor_id: tm.tentor_id,
          mapel_id: tm.mapel_id,
          tahun_ajaran_id
        }))
      )

      if (privatError) throw privatError
    }
  } catch (e) {
    await rollbackAccount(profileId)
    throw e
  }

  return profileId
}

export async function deleteSiswa(id: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
