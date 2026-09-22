import { supabaseAdmin as supabase } from '$lib/supabase/admin.server'
import { createAccount, rollbackAccount } from './account.server'
import type { Wali } from './wali'

export async function listWali() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nama_lengkap, email, created_at, deleted_at')
    .eq('role', 'wali_murid')
    .is('deleted_at', null)
    .order('nama_lengkap')

  if (error) throw error
  return data as Wali[]
}

export async function createWali(
  nama_lengkap: string,
  email: string,
  password: string,
  tahun_ajaran_id: string,
  siswa_ids: string[]
) {
  if (!tahun_ajaran_id) throw new Error('Tahun ajaran wajib dipilih')
  if (!siswa_ids || siswa_ids.length === 0) throw new Error('Minimal satu siswa harus dipilih')

  const waliId = await createAccount({
    role: 'wali_murid',
    nama_lengkap,
    email,
    password,
    tahun_ajaran_id
  })

  // Tautan ke anak dibuat setelah akun jadi. Kalau gagal, akunnya ditarik lagi
  // supaya emailnya tidak terkunci oleh wali tanpa anak yang tidak bisa dipakai.
  const { error: linkError } = await supabase
    .from('wali_siswa')
    .insert(siswa_ids.map((siswa_detail_id) => ({ wali_id: waliId, siswa_detail_id })))

  if (linkError) {
    await rollbackAccount(waliId)
    throw linkError
  }

  return waliId
}

export async function deleteWali(id: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

/** id anak yang ditautkan ke satu wali. Dipakai form edit untuk mencentang ulang. */
export async function listSiswaIdsForWali(waliId: string) {
  const { data, error } = await supabase
    .from('wali_siswa')
    .select('siswa_detail_id')
    .eq('wali_id', waliId)

  if (error) throw error
  return (data ?? []).map((row) => row.siswa_detail_id as string)
}
