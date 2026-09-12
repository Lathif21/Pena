import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { nilaiAnak, kehadiranAnak } from '$features/parent/data/anak.server'

/**
 * Laporan satu siswa untuk dicetak.
 *
 * Memakai `nilaiAnak` dan `kehadiranAnak` milik fitur wali: pertanyaannya sama
 * persis — nilai dan kehadiran satu siswa. Menulis query kedua yang sedikit
 * berbeda hanya akan menghasilkan dua angka rata-rata yang kadang tidak cocok,
 * dan itu pertanyaan pertama yang akan diajukan wali murid.
 */
export async function load({ cookies, parent, params }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  const { data: siswa } = await supabase
    .from('siswa_detail')
    .select(`
      id, nis, paket,
      profile:profile_id(nama_lengkap, email),
      siswa_kelas(deleted_at, kelas:kelas_id(nama))
    `)
    .eq('id', params.siswaId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!siswa) throw svelteError(404, 'Siswa tidak ditemukan')

  const enrolment = ((siswa as any).siswa_kelas ?? []).find((sk: any) => !sk.deleted_at)

  const [nilai, kehadiran] = await Promise.all([
    nilaiAnak(supabase, siswa.id),
    kehadiranAnak(supabase, siswa.id)
  ])

  const { data: ta } = await supabase
    .from('tahun_ajaran')
    .select('nama')
    .eq('id', parentData.profile.tahun_ajaran_id)
    .maybeSingle()

  return {
    ...parentData,
    siswa: {
      id: siswa.id,
      nama: (siswa as any).profile?.nama_lengkap ?? '(tanpa nama)',
      email: (siswa as any).profile?.email ?? '',
      nis: siswa.nis,
      paket: siswa.paket,
      kelasNama: enrolment?.kelas?.nama ?? ''
    },
    nilai,
    kehadiran,
    tahunAjaran: ta?.nama ?? ''
  }
}
