import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()
  const tentorId = parentData.user.id

  const { data: sesi } = await supabase
    .from('sesi_mengajar')
    .select('id, kelas_id, mapel_id, status, kelas:kelas_id(nama), mapel:mapel_id(nama)')
    .eq('tentor_id', tentorId)
    .eq('status', 'open')
    .is('deleted_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Tanpa presensi diri belum ada sesi, dan presensi murid memang diblokir
  // sampai itu terjadi — halaman tetap dibuka, tapi isinya arahan, bukan tabel.
  // Bentuk `tersimpan` harus sama di kedua cabang return, kalau tidak tipenya
  // menyatu jadi `{} | Record<...>` dan halaman tidak bisa mengindeksnya.
  const kosong: Record<string, boolean> = {}

  if (!sesi) return { ...parentData, sesiAktif: null, siswa: [], tersimpan: kosong }

  const { data: anggota } = await supabase
    .from('siswa_kelas')
    .select('siswa_detail:siswa_detail_id(id, nis, deleted_at, profiles:profile_id(nama_lengkap))')
    .eq('kelas_id', sesi.kelas_id)
    .is('deleted_at', null)

  // Siswa privat tidak pernah muncul: mereka tidak punya baris di siswa_kelas.
  const siswa = ((anggota ?? []) as any[])
    .map((row) => row.siswa_detail)
    .filter((s) => s && !s.deleted_at)
    .map((s) => ({
      siswa_detail_id: s.id,
      nis: s.nis,
      nama_lengkap: s.profiles?.nama_lengkap ?? '(tanpa nama)'
    }))
    .sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap))

  const { data: presensi } = await supabase
    .from('presensi_murid')
    .select('siswa_detail_id, is_hadir')
    .eq('sesi_id', sesi.id)

  return {
    ...parentData,
    sesiAktif: {
      id: sesi.id,
      kelasNama: (sesi as any).kelas?.nama ?? '',
      mapelNama: (sesi as any).mapel?.nama ?? ''
    },
    siswa,
    tersimpan: Object.fromEntries(
      (presensi ?? []).map((p: any) => [p.siswa_detail_id, p.is_hadir])
    ) as Record<string, boolean>
  }
}
